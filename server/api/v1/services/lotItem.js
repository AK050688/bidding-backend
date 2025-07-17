import lotItemModel from "../../../models/lotItem";

const lotItemServices = {
  findTransaction: async (transactionId) => {
    return await lotItemModel.find().populate("buyerId sellerId productId bidId")

  },
  findAndUpdate: async (transactionId, updateObj) => {
    return await lotItemModel.findOneAndUpdate(
      { transactionId },
      { paymentStatus: newStatus },
      { new: true }
    )
  },
  createRequest: async (insertObj) => {
    return await lotItemModel.create(insertObj);
  },
  findTransactionByOrderId: async (orderId) => {
    return await lotItemModel.findOne({ transactionId: orderId });
  },
  updateTransactionByOrderId: async (orderId, updateObj) => {
    return await lotItemModel.findOneAndUpdate(
      { transactionId: orderId },
      { $set: updateObj },
      { new: true }
    );
  },
  countTransactionsByBuyerId: async (buyerId) => {
    return await lotItemModel.countDocuments({ buyerId });
  },
 findTransactions: async (query) => {
  return await lotItemModel
    .find(query)
    .select("paymentStatus buyerId")
    .populate({ path: "buyerId", select: "name" });
}




}
  
export default lotItemServices;
