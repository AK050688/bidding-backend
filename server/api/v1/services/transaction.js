import transactionsModel from "../../../models/transaction.js";

const transactionServices = {


    createRequest: async (insertObj) => {
        return await transactionsModel.create(insertObj);
    },
     findTransactionByOrderId: async (orderId) => {
    return await transactionsModel.findOne({ transactionId: orderId });
  },
  updateTransactionByOrderId: async (orderId, updateObj) => {
    return await transactionsModel.findOneAndUpdate(
      { transactionId: orderId },
      { $set: updateObj },
      { new: true }
    );
  }

}
export default transactionServices;
