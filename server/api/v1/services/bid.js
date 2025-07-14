import bidModel from "../../../models/bidschema.js";
import userModel from "../../../models/user.js";
import sellerModel from "../../../models/seller.js";
import { userType } from "../../../enums/userType.js";
import { statusOfApproval } from "../../../enums/statusOfApproval.js";
import { status } from "../../../enums/status.js";
import productModel from "../../../models/product.js";
import mongoose from "mongoose";

const bitServices = {
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
  placeBid: async (inserObj) => {
    return await bidModel.create(inserObj);
  },
  findBid: async (inserObj) => {
    return await bidModel.find(inserObj).populate({ path: "productId" });
  },
  findPtoductaggration: async (buyerId) => {
    // return await bidModel.find({buyerId:buyerId}).populate({path:"productId",select:"",populate:({path:"categoryId", select:"categoryName"})})
    return await bidModel.aggregate([
      {
        $match: { buyerId: new mongoose.Types.ObjectId(buyerId) }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.categoryId",
          foreignField: "_id",
          as: "product.categoryId"
        }
      },
      { $unwind: "$product.categoryId" },
  
      {
        $project: {
          // _id: 1,
          productId: {
            _id: "$product._id",
            name: "$product.name",
            brandName: "$product.brandName",
            quantity: "$product.quantity",
            startTime: "$product.startTime",
            endTime: "$product.endTime",
            categoryId: {
              _id: "$product.categoryId._id",
              categoryName: "$product.categoryId.categoryName"
            }
          },
    
          buyerId: "$buyerId",
          bidAmount: "$bidAmount",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          __v: "$__v"
        }
      }
    ]);
  },

  checkPlacedBid: async (buyerId, productId) => {
    return await bidModel.find({ buyerId: buyerId, productId: productId });
  },
  checkProduct: async (productId) => {
    const updatedProduct = await productModel.findById(productId);

    return updatedProduct;
  },
  getBidsOnProduct: async (productId, userId, pagination) => {
    try {
      const { page = 1, limit = 10 } = pagination;
      const query = { productId, buyerId: userId };
      const skip = (page - 1) * limit;
      const total = await bidModel.countDocuments(query);
      const bids = await bidModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return {
        bids,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching bids on product: ${error}`);
    }
  },
  getSellerProductBids: async (productId, userId, pagination) => {
    try {
      // Validate product
      const product = await productModel.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check if bidding is active
      const currentTime = new Date();

      if (
        currentTime < product.startTime ||
        currentTime > product.endTime ||
        product.isSold
      ) {
        throw new Error("Bidding is not active for this product");
      }

      // Check if user is admin or seller
      const user = await userModel.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.userType !== userType.ADMIN) {
        // For non-admins, verify seller status and ownership
        const seller = await sellerModel.findOne({
          buyerId: userId,
          statusOfApproval: statusOfApproval.ACCEPTED,
        });

        if (!seller) {
          throw new Error("Seller not found or not approved");
        }
        if (product.sellerId.toString() !== seller._id.toString()) {
          throw new Error("Unauthorized: You can only view bids for your own products");
        }
      }

      const { page = 1, limit = 10 } = pagination;

      // Query all bids for the product
      const query = { productId };

      const skip = (page - 1) * limit;
      const total = await bidModel.countDocuments(query);
      const bids = await bidModel
        .find(query)
        .sort({ createdAt: -1 }) // Sort by most recent bid
        .skip(skip)
        .limit(limit)
        .lean();

      return {
        bids,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching seller product bids: ${error.message}`);
    }
  },
  getSellerProductsWithBids: async (sellerId, userId, pagination) => {
    try {
      // // Validate seller
      // const seller = await sellerModel.findById(sellerId);
      // if (!seller) {
      //   throw new Error("Seller not found");
      // }

      // // Check if user is admin or seller
      // const user = await userModel.findById(userId);
      // if (!user) {
      //   throw new Error("User not found");
      // }

      // if (user.userType !== userType.ADMIN) {
      //   // For non-admins, verify seller status and ownership
      //   const requestingSeller = await sellerModel.findOne({
      //     buyerId: userId,
      //     statusOfApproval: statusOfApproval.ACCEPTED,
      //   });
      //   if (!requestingSeller) {
      //     throw new Error("Seller not found or not approved");
      //   }
      //   if (seller._id.toString() !== requestingSeller._id.toString()) {
      //     throw new Error("Unauthorized: You can only view your own products");
      //   }
      // }

      const { page = page || 1, limit = limit || 10 } = pagination;

      // Query live products for the seller
      const query = {
        $and: [
          { sellerId },
          { startTime: { $lte: new Date() } },
          { endTime: { $gte: new Date() } },
          { isSold: false },
        ],
      };

      const skip = (page - 1) * limit;
      const total = await productModel.countDocuments(query);
      const products = await productModel
        .find(query)
        .sort({ startTime: -1 }) // Sort by most recent
        .skip(skip)
        .limit(limit)
        .lean();

      // Fetch bids for each product
      const productIds = products.map((product) => product._id);
      const bids = await bidModel
        .find({ productId: { $in: productIds } })
        .sort({ createdAt: -1 }) // Sort bids by most recent
        .lean();

      // Combine products with their bids
      const productsWithBids = products.map((product) => ({
        ...product,
        bids: bids.filter((bid) => bid.productId.toString() === product._id.toString()),
      }));

      return {
        products: productsWithBids,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching seller products with bids: ${error.message}`);
    }
  },
  getSellerProductsWithEndBids: async (sellerId, userId, pagination) => {
    try {
      // // Validate seller
      // const seller = await sellerModel.findById(sellerId);
      // if (!seller) {
      //   throw new Error("Seller not found");
      // }

      // // Check if user is admin or seller
      // const user = await userModel.findById(userId);
      // if (!user) {
      //   throw new Error("User not found");
      // }

      // if (user.userType !== userType.ADMIN) {
      //   // For non-admins, verify seller status and ownership
      //   const requestingSeller = await sellerModel.findOne({
      //     buyerId: userId,
      //     statusOfApproval: statusOfApproval.ACCEPTED,
      //   });
      //   if (!requestingSeller) {
      //     throw new Error("Seller not found or not approved");
      //   }
      //   if (seller._id.toString() !== requestingSeller._id.toString()) {
      //     throw new Error("Unauthorized: You can only view your own products");
      //   }
      // }

      const { page = page || 1, limit = limit || 10 } = pagination;

      // Query live products for the seller
      const query = {
        $and: [
          { sellerId },
          { endTime: { $gte: new Date() } },
        ],
      };

      const skip = (page - 1) * limit;
      const total = await productModel.countDocuments(query);
      const products = await productModel
        .find(query)
        .sort({ startTime: -1 }) // Sort by most recent
        .skip(skip)
        .limit(limit)
        .lean();

      // Fetch bids for each product
      const productIds = products.map((product) => product._id);
      const bids = await bidModel
        .find({ productId: { $in: productIds } })
        .sort({ createdAt: -1 }) // Sort bids by most recent
        .lean();

      // Combine products with their bids
      const productsWithBids = products.map((product) => ({
        ...product,
        bids: bids.filter((bid) => bid.productId.toString() === product._id.toString()),
      }));

      return {
        products: productsWithBids,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching seller products with bids: ${error.message}`);
    }
  },
};

export default bitServices;
