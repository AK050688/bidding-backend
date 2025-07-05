import sellerModel from "../../../models/seller.js"
import { status } from "../../../enums/status.js";
import { userType } from "../../../enums/userType.js";
import userModel from "../../../models/user.js"
import { statusOfApproval } from "../../../enums/statusOfApproval.js";

const sellerServices = {

    checkForRequest: async (email, orgnizationPhone, gstNumber) => {
        const query = { $or: [{ email: email }, { orgnizationPhone: orgnizationPhone }, { gstNumber: gstNumber }] }
        const user = await sellerModel.findOne(query);
        return user
    },
    createRequest: async (insertObj) => {
        return await sellerModel.create(insertObj);
    },
    findUserById: async (id) => {
        return await userModel.findOne({ $and: [{ _id: id }, { status: { $ne: status.BLOCK } }] });
    },
    findSellerById: async (id) => {
        return await sellerModel.findOne({ $and: [{ _id: id }, { statusOfApproval: { $ne: statusOfApproval.REJECTED } }] });
    },

    updateSellerById: async (id, obj) => {
        return await sellerModel.findByIdAndUpdate({_id:id}, obj, { new: true });
    },
    updateUser: async (query, obj) => {
        return await sellerModel.findOneAndUpdate(query, obj, { new: true });
    },
    findAll: async () => {
        return await sellerModel.find()
    },
    findAdmin: async (id) => {
        const admin = await sellerModel.findOne({ $and: [{ _id: id }, { userType: userType.ADMIN }] });
        return admin;
    },
    paginate: async (query, page, limit) => {
        try {
            const options = {
                page: parseInt(page) || parseInt(1),
                limit: parseInt(limit) || parseInt(5),
                select: '-password ',
            };
            const data = await sellerModel.paginate(query, options)
            console.log(data);
            return data;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
    dashboard: async () => {

        const totalUsers = await userModel.find({ userType: userType.USER, status: status.ACTIVE }).countDocuments();
        const totalProducts = await productModel.find().countDocuments();
        const totalOrders = await orderModel.find({ transactionStatus: transactionStatus.SUCCESS }).countDocuments();
        const sendData = { totalOrders, totalProducts, totalUsers }
        return sendData

    },

}
export default sellerServices;