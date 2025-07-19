import lotModel from "../../../models/lot.js";

const lotServices = {
  findlot: async (lot) => {
    return await lotModel.find(lot)

  },
  createlot: async (insertObj) => {
    return await lotModel.create(insertObj);
  },
  findAllLot: async () => {
    return await lotModel.findOne({ transactionId: orderId });
  },
  findLotByFilter: async (filter) => {
    return await lotModel.find(filter).populate("categoryId", "categoryName")
      .populate("sellerId", "name email")
      .populate("lotItemId")
      .sort({ createdAt: -1 });
  },
  findLotById: async (id) => {
    return await lotModel.findById(id)
      .populate("categoryId")
      .populate("sellerId")
      .populate("winnerId")
      .populate("lotItemId")
      .populate("bidId")
  },
  updateLotById: async (id, updateData) => {
    return await lotModel.findByIdAndUpdate(id, updateData, { new: true });
  },
  findLotById: async (id) => {
    return await lotModel.findById(id);
  },
  findActiveLots: async () => {
    const now = new Date();
    return await lotModel.find({
      isSold: false,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
  },
  findExpiredLots: async () => {
    const now = new Date();

    return await lotModel.find({
      endDate: { $lt: now },
      isSold: false,
    })
      .populate("sellerId", "name email")
      .populate("categoryId", "categoryName")
      .populate("lotItemId");
  },
  findlots: async (filter) => {
    return await lotModel.find(filter).populate("sellerId").populate("categoryId");
  },
  findSoldLots: async () => {
    return await lotModel.find({ isSold: true }).countDocuments();
     
  },
  findAllLotDocuments: async () => {
    const lot = await lotModel.find().countDocuments()
    return lot;

  },
  findById:async()=>{
    return await lotModel.findById();
  },
 



}

export default lotServices;
