import productModel from "../../../models/product.js";
import userModel from "../../../models/user.js";
import sellerModel from "../../../models/seller.js";
import categoryModel from "../../../models/category.js";
import { userType } from "../../../enums/userType.js";
import { statusOfApproval } from "../../../enums/statusOfApproval.js";
import { status } from "../../../enums/status.js";
import BidModel from "../../../models/bidschema.js"
export default {
  findAdmin: async (id) => {
    const admin = await userModel.findOne({
      $and: [{ _id: id }, { userType: userType.ADMIN }],
    });
    return admin;
  },
  findUserById: async (id) => {
    return await userModel.findOne({
      $and: [{ _id: id }, { status: { $ne: status.BLOCK } }],
    });
  },
  getHighestBidForProduct: async(productId)=>{
  return await BidModel
    .findOne({ productId })
    .sort({ bidAmount: -1 })  // highest first
    .limit(1)
    // .populate("buyerId")
},

  findSeller: async (id) => {
    // const seller = await sellerModel.findOne({ _id: id, $or: [{ userType: userType.ADMIN }, { $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] }] });
    return await sellerModel.findOne({
      $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }],
    });
    // const seller = await sellerModel.findOne({ $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] });
  },
  findSellerByBuyerId: async (id) => {
    // const seller = await sellerModel.findOne({ _id: id, $or: [{ userType: userType.ADMIN }, { $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] }] });
    return await sellerModel.findOne({
      $and: [{ buyerId: id }, { statusOfApproval: statusOfApproval.ACCEPTED }],
    });
    // const seller = await sellerModel.findOne({ $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] });
  },
  findSellerOrAdmin: async (id) => {
    try {
      const admin = await userModel.findOne({
        _id: id,
        userType: userType.ADMIN,
      });

      if (admin) {
        return admin;
      }

      const seller = await sellerModel.findOne({
        $and: [
          { buyerId: id },
          { statusOfApproval: statusOfApproval.ACCEPTED },
        ],
      });

      return seller;
    } catch (error) {
      throw new Error(`Error finding seller: ${error.message}`);
    }
  },
  createProduct: async (insertObj) => {
    return await productModel.create(insertObj);
  },
  updateProduct: async (productId, productData) => {
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { $set: productData },
      { new: true }
    );

    return updatedProduct;
  },
  checkProduct: async (productId) => {
    const updatedProduct = await productModel.findById(productId);

    return updatedProduct;
  },
  checkCategory: async (id) => {
    const categoryResult = await categoryModel.findById(id);
    return categoryResult;
  },
  findProductsOfSeller: async (id) => {
    const productResult = await productModel.find({ buyerId: id });
    return productResult;
  },
  deleteProduct: async (productId) => {
    const deleteProduct = await productModel.findByIdAndDelete(productId);
    return deleteProduct;
  },
  getFilteredProducts: async (filters) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "recentlyStarted",
        search,
        categoryId,
      } = filters;

      const query = {
        $and: [
          { startTime: { $lte: new Date() } },
          { endTime: { $gte: new Date() } },
          { isSold: false },
        ],
      };

      // Add search by name
      if (search) {
        query.$and.push({ name: { $regex: search, $options: "i" } });
      }

      // Add category filter
      if (categoryId) {
        query.$and.push({ categoryId });
      }

      // Define sort options
      const sortOptions = {
        recentlyStarted: { startTime: -1 },
        soonestToEnd: { endTime: 1 },
        priceLowToHigh: { minBid: 1 },
        priceHighToLow: { minBid: -1 },
      };

      const sort = sortOptions[sortBy] || sortOptions.recentlyStarted;

      // Calculate pagination
      const skip = (page - 1) * limit;
      const total = await productModel.countDocuments(query);
      const products = await productModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      return {
        products,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching filtered products: ${error.message}`);
    }
  },
  getProductsByCategoryAndBrand: async (filters) => {
    try {
      const { categoryId, page = 1, limit = 10 } = filters;

      // Validate category
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }

      const query = {
        $and: [
          { categoryId },
          { startTime: { $lte: new Date() } },
          { endTime: { $gte: new Date() } },
          { isSold: false },
        ],
      };

      // Aggregate to get one product per brandName
      const pipeline = [
        { $match: query },
        {
          $group: {
            _id: "$brandName",
            product: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$product" } },
        { $sort: { startTime: -1 } }, // Default sort by recently started
        { $skip: (page - 1) * limit },
        { $limit: Number(limit) },
      ];

      const products = await productModel.aggregate(pipeline).exec();
      const total = await productModel.aggregate([
        { $match: query },
        { $group: { _id: "$brandName" } },
        { $count: "total" },
      ]).exec();

      const totalCount = total.length > 0 ? total[0].total : 0;

      return {
        products,
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching products by category and brand: ${error.message}`);
    }
  },
};
