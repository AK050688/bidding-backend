import lotModel from "../../../models/lot.js";

const lotServices = {
  findlot: async (lot) => {
    return await lotModel.find(lot).populate({path:"lotItemId",path:"categoryId",select: "categoryName"})

  },
  createlot: async (insertObj) => {
    return await lotModel.create(insertObj);
  },
  findAllLot: async () => {
    return await lotModel.findOne({ transactionId: orderId });
  },
  findLotByFilter: async (filter, skip = 0, limit = 10) => {
    return await lotModel.find(filter).populate("categoryId", "categoryName")
      .populate("sellerId", "name email")
      .populate("lotItemId")
      .skip(skip).limit(limit)
      .sort({ createdAt: -1 })
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
    return await lotModel.findById(id).populate("lotItemId");
  },
 
  findActiveLots :async (skip = 0, limit = 10) => {
  const now = new Date();

  const query = {
    startDate: { $lte: now },
    endDate: { $gte: now },
    isSold: false,
  };

  const lots = await lotModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

  return { lots };
},

  // findExpiredLots: async () => {
  //   const now = new Date();

  //   return await lotModel.find({
  //     endDate: { $lt: now },
  //     isSold: false,
  //   })
  //     .populate("sellerId", "name email")
  //     .populate("categoryId", "categoryName")
  //     .populate("lotItemId");
  // },
  findExpiredLots :async (skip = 0, limit = 10) => {
  const now = new Date();

  const query = {
    endDate: { $lt: now },
    isSold: false,
  };

  return await lotModel.find(query).skip(skip).limit(limit).sort({ endDate: -1 }).populate("sellerId", "name email")
      .populate("categoryId", "categoryName")
      .populate("lotItemId");

},

  // findlots: async (filter) => {
  //   return await lotModel.find(filter).populate("sellerId").populate("categoryId");
  // },

findlots :async (query, skip = 0, limit = 10) => {
  return await lotModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("sellerId").populate("categoryId");
},

  findSoldLots: async () => {
    return await lotModel.find({ isSold: true }).countDocuments();
     
  },
  findAllLotDocuments: async () => {
    const lot = await lotModel.find().countDocuments()
    return lot;

  },
  findById:async(id)=>{
    return await lotModel.findById(id);
  },
 



}

export default lotServices;
