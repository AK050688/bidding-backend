import categoryModel from "../../../models/category.js"
import userModel from "../../../models/user.js"
import { userType } from "../../../enums/userType.js";


export default {

    findAdmin: async (id) => {
        const admin = await userModel.findOne({ $and: [{ _id: id }, { userType: userType.ADMIN }] });
        return admin;
    },

    findSeller: async (id) => {
        const admin = await userModel.findOne({ $and: [{ _id: id }, { userType: userType.SELLER }] });
        return admin;
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
    }



} 