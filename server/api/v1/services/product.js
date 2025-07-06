import productModel from "../../../models/product.js";
import userModel from "../../../models/user.js";
import sellerModel from "../../../models/seller.js";
import categoryModel from "../../../models/category.js";
import { userType } from "../../../enums/userType.js";
import { statusOfApproval } from "../../../enums/statusOfApproval.js";
import { status } from "../../../enums/status.js";
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
  findSeller: async (id) => {
    // const seller = await sellerModel.findOne({ _id: id, $or: [{ userType: userType.ADMIN }, { $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] }] });
    return await sellerModel.findOne({
      $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }],
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
};
