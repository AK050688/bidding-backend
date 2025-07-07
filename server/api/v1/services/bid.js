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
};
