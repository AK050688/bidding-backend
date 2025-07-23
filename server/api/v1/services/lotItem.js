import lotItemModel from "../../../models/lotItem.js";

const lotItemServices = {
  findLotItem: async (transactionId) => {
    return await lotItemModel.find();

  },

  createRequest: async (data) => {
    return await lotItemModel.create(data);
  },
 findLotByIds: async (id) => {
  return await lotItemModel.findById(id); 
},
findByIdAndUpdate: async (id, updateData) => {
  return await lotItemModel.findByIdAndUpdate(id, updateData, { new: true });
},
findAndDelete: async (id) => {
  return await lotItemModel.findByIdAndDelete(id);
},
findExistingBrand:async ({ lotId, sellerId, brandName }) => {
  return await lotItemModel.findOne({
    lotId,
    sellerId,
    brandName,
  })
},







}
  
export default lotItemServices;
