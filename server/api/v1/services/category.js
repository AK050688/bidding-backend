import categoryModel from "../../../models/category.js"
// import productModel from "../../../models/product.js"
import userModel from "../../../models/user.js"
import sellerModel from "../../../models/seller.js"
import { userType } from "../../../enums/userType.js";
import { statusOfApproval } from "../../../enums/statusOfApproval.js";
import { status } from "../../../enums/status.js";


export default {

    findAdmin: async (id) => {
        return await userModel.findOne({ $and: [{ _id: id }, { userType: userType.ADMIN }] });

    },
    findUserById: async (id) => {
        return await userModel.findOne({ $and: [{ _id: id }, { status: { $ne: status.BLOCK } }] });
    },
    findSeller: async (id) => {
        // const seller = await sellerModel.findOne({ _id: id, $or: [{ userType: userType.ADMIN }, { $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] }] });
        return await sellerModel.findOne({ $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] });

        // const seller = await sellerModel.findOne({ $and: [{ _id: id }, { statusOfApproval: statusOfApproval.ACCEPTED }] });
    },
    createCategory: async (obj) => {
        const createdCategory = await categoryModel.create(obj);
        return createdCategory;
    },
    updateCategory: async (id, obj) => {
        const updated = await categoryModel.findByIdAndUpdate(id, obj, { new: true });
        return updated;
    },
    findCategory: async (id) => {
        const categoryResult = await categoryModel.findOne(id);
        return categoryResult;
    },
    deleteCategory: async (id) => {
        const categoryResult = await categoryModel.findByIdAndDelete(id);
        return categoryResult;
    },
    findAllCategory: async (query) => {
        const categoryResult = await categoryModel.find(query);
        return categoryResult;
    },
    findAllCategoryV1: async (skip = 0, limit = 10) => {
        return await categoryModel.find().skip(skip).limit(limit).sort({ createdAt: -1 });
    }



} 