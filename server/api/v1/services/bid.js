import bidModel from "../../../models/bidschema.js";
import userModel from "../../../models/user.js";
import sellerModel from "../../../models/seller.js";
import { userType } from "../../../enums/userType.js";
import { statusOfApproval } from "../../../enums/statusOfApproval.js";
import { status } from "../../../enums/status.js";
import productModel from "../../../models/product.js";

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
  placeBid: async (inserObj) => {
    return await bidModel.create(inserObj);
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

      const { page = 1, limit = 10 } = pagination;

      // Query bids for the authenticated user only
      const query = { productId, buyerId: userId };

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
      throw new Error(`Error fetching bids on product: ${error.message}`);
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
};
