import bidModel from "../../../models/bidschema.js";
import userModel from "../../../models/user.js";
import sellerModel from "../../../models/seller.js";
import { userType } from "../../../enums/userType.js";
import { statusOfApproval } from "../../../enums/statusOfApproval.js";
import { status } from "../../../enums/status.js";
import lotModel from "../../../models/lot.js";
// import productModel from "../../../models/product.js";
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
    return await bidModel.find(inserObj).populate({ path: "lotId" });
  },
checkbid: (inserObj) => {
  return bidModel.find(inserObj).populate({
    path: "buyerId",
    select: "name email mobile userType"
  });
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

  checkPlacedBid: async (buyerId, lotId) => {
    return await bidModel.find({ buyerId: buyerId, lotId: lotId });
  },
  checklot: async (lotId) => {
    return await lotModel.findById(lotId);
  },
  getBidsOnLot: async (lotId, userId, pagination) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = { lotId, buyerId: userId };

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
  getSellerlotsWithBids: async (sellerId, userId, pagination) => {
    try {
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
      const total = await lotModel.countDocuments(query);
      const lots = await lotModel
        .find(query)
        .sort({ startTime: -1 }) // Sort by most recent
        .skip(skip)
        .limit(limit)
        .lean();

      // Fetch bids for each lot
      const lotIds = lots.map((product) => product._id);
      const bids = await bidModel
        .find({ lotId: { $in: lotIds } })
        .sort({ createdAt: -1 }) // Sort bids by most recent
        .lean();

      // Combine lot  with their bids
      const lotWithBids = lots.map((product) => ({
        ...product,
        bids: bids.filter((bid) => bid.lotId.toString() === product._id.toString()),
      }));

      return {
        lots: lotWithBids,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching seller products with bids: ${error.message}`);
    }
  },
  getSellerlotsWithEndBids: async (sellerId, userId, pagination) => {
    try {


      const { page = page || 1, limit = limit || 10 } = pagination;

      // Query live products for the seller
      const query = {
        $and: [
          { sellerId },
          { endTime: { $gte: new Date() } },
        ],
      };

      const skip = (page - 1) * limit;
      const total = await lotModel.countDocuments(query);
      const lots = await lotModel
        .find(query)
        .sort({ startTime: -1 }) // Sort by most recent
        .skip(skip)
        .limit(limit)
        .lean();

      // Fetch bids for each product
      const lotIds = lots.map((lot) => lot._id);
      const bids = await bidModel
        .find({ lotId: { $in: lotIds } })
        .sort({ createdAt: -1 }) // Sort bids by most recent
        .lean();

      // Combine products with their bids
      const lotsWithBids = lots.map((lot) => ({
        ...lot,
        bids: bids.filter((bid) => bid.lotId.toString() === lot._id.toString()),
      }));

      return {
        lots: lotsWithBids,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching seller products with bids: ${error.message}`);
    }
  },
  getLiveBidCount: async () => {
    const now = new Date();

    const result = await bidModel.aggregate([
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
        $match: {
          "product.isSold": false,
          "product.startTime": { $lte: now },
          "product.endTime": { $gte: now }
        }
      },
      {
        $count: "liveBids"
      }
    ]);

    return result.length > 0 ? result[0].liveBids : 0;
  },
  getLiveBidCounts: async () => {
    const currentTime = new Date();
 
    // Find all bids with their product populated
    const bids = await bidModel.find()

    let liveBidCount = 0;

    for (const bid of bids) {
      const lot = bid.lotId;

      // Check if product is live and not sold
      if (
        currentTime >= lot.startTime &&
        currentTime <= lot.endTime &&
        !lot.isSold
      ) {
        liveBidCount++;
      }
    }

    return liveBidCount;
  },
  updateLot: async (lotId, updateData) => {
    return await lotModel.findByIdAndUpdate(lotId, updateData, { new: true });
  },
   BidCount: async (inserObj) => {
    return await bidModel.countDocuments(inserObj);
  },

};

export default bitServices;
