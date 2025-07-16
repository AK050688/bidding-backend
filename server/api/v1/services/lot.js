import lotModel from "../../../models/lotSchema";

const lotServices = {
  findTransaction: async (transactionId) => {
    return await lotModel.find().populate("buyerId sellerId productId bidId")

  },
  findAndUpdate: async (transactionId, updateObj) => {
    return await lotModel.findOneAndUpdate(
      { transactionId },
      { paymentStatus: newStatus },
      { new: true }
    )
  },
  createRequest: async (insertObj) => {
    return await lotModel.create(insertObj);
  },
  findTransactionByOrderId: async (orderId) => {
    return await lotModel.findOne({ transactionId: orderId });
  },
  updateTransactionByOrderId: async (orderId, updateObj) => {
    return await lotModel.findOneAndUpdate(
      { transactionId: orderId },
      { $set: updateObj },
      { new: true }
    );
  },
  countTransactionsByBuyerId: async (buyerId) => {
    return await lotModel.countDocuments({ buyerId });
  },
 findTransactions: async (query) => {
  return await lotModel
    .find(query)
    .select("paymentStatus buyerId")
    .populate({ path: "buyerId", select: "name" });
}




}
  
export default lotServices;
