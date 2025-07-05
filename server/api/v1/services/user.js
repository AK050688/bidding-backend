import userModel from "../../../models/user.js"
import {status} from "../../../enums/status.js";
import {userType} from "../../../enums/userType.js";

const userServices = {
  checkUserExists: async (email, mobileNumber) => {
    let query = { $and: [{ status: { $ne: status.DELETE } }, { $or: [{ email: email }, { mobileNumber: mobileNumber }] }] }
    return await userModel.findOne(query);
  },
  createUser: async (insertObj) => {
    return await userModel.create(insertObj);
  },
  findUser: async (email) => {
    return await userModel.findOne({ $and: [{ email: email }, { status: { $ne: status.BLOCK } }] });
  },
  findUserV2: async (email) => {
    return await userModel.findOne({ $and: [{ email: email }, { status: { $ne: status.DELETE } }] });
  },
  findUserById: async (id) => {
    return await userModel.findOne({ $and: [{ _id: id }, { status: { $ne: status.DELETE } }] });
  },
  updateUserById: async (query, obj) => {
    return await userModel.findByIdAndUpdate(query, obj, { new: true });
  },
  updateUser: async (query, obj) => {
    return await userModel.findOneAndUpdate(query, obj, { new: true });
  },
  findAll: async () => {
    return await userModel.find()
  },
  findAdmin: async (query) => {
    return await userModel.findOne(query);
  },
    findAdminv2: async (id) => {
          const admin = await userModel.findOne({ $and: [{ _id: id }, { userType: userType.ADMIN }] });
          return admin;
      },
  paginate: async (query, page, limit) => {
    try {
      const options = {
        page: parseInt(page) || parseInt(1),
        limit: parseInt(limit) || parseInt(5),
        select: '-password ',
      };
      const data = await userModel.paginate(query, options)
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  dashboard: async () => {
    
const totalUsers = await userModel.find({userType:userType.USER, status:status.ACTIVE }).countDocuments();
const totalProducts = await productModel.find().countDocuments();
const totalOrders = await orderModel.find({transactionStatus:transactionStatus.SUCCESS}).countDocuments();
const sendData = {totalOrders,totalProducts,totalUsers}
return sendData

  },

}
export default userServices;