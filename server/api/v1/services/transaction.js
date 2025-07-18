import transactionsModel from "../../../models/transaction.js";

const transactionServices = {
  findTransaction: async (transactionId) => {
    return await transactionsModel.find().populate("buyerId sellerId productId bidId")

  },
  findAndUpdate: async (transactionId, updateObj) => {
    return await transactionsModel.findOneAndUpdate(
      { transactionId },
      { paymentStatus: newStatus },
      { new: true }
    )
  },
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
  },
  countTransactionsByBuyerId: async (buyerId) => {
    return await transactionsModel.countDocuments({ buyerId });
  },
 findTransactions: async (query) => {
  return await transactionsModel
    .find(query)
    .select("paymentStatus buyerId")
    .populate({ path: "buyerId", select: "name" });
}




























}
  
export default transactionServices;
