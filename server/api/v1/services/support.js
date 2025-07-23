import supportModel from "../../../models/support.js"
import sellerModel from "../../../models/seller.js"
import { status } from "../../../enums/status.js";
import { userType } from "../../../enums/userType.js";
import userModel from "../../../models/user.js"
import { statusOfApproval } from "../../../enums/statusOfApproval.js";
import { supportStatus } from "../../../enums/supportStatu.js";

const supportServices = {

    checkForSupport: async (email,mobileNumber) => {
        const query = { $or: [{ email: email }, { mobileNumber: mobileNumber }] }
        const support = await supportModel.findOne(query);
        return support
    },
    createRequest: async (insertObj) => {
        return await supportModel.create(insertObj);
    },
    findUserById: async (id) => {
        return await userModel.findOne({ $and: [{ _id: id }, { status: { $ne: status.BLOCK } }] });
    },
    findSellerById: async (id) => {
        return await sellerModel.findOne({ $and: [{ _id: id }, { statusOfApproval: { $ne: statusOfApproval.REJECTED } }] }).populate({ path: "buyerId", select: "firstName lastName email mobileNumber addressLine city zip status userType" });
    },
    updateSellerById: async (id, obj) => {
        return await sellerModel.findByIdAndUpdate({ _id: id }, obj, { new: true });
    },
    updateUser: async (query, obj) => {
        return await sellerModel.findOneAndUpdate(query, obj, { new: true });
    },
    findAllSupport: async (query) => {
        return await supportModel.find(query)
    },
    findAdmin: async (id) => {
        const admin = await sellerModel.findOne({ $and: [{ _id: id }, { userType: userType.ADMIN }] });
        return admin;
    },
   

}
export default supportServices;