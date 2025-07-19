import lotItemModel from "../../../models/lotItem.js";

const lotItemServices = {
  findLotItem: async (transactionId) => {
    return await lotItemModel.find();

  },

  createRequest: async (insertObj) => {
    return await lotItemModel.create(insertObj);
  },
 findLotById: async (id) => {
  return await lotItemModel.findById(id); 
},
findByIdAndUpdate: async (insertObj) => {
  const { id, ...updateData } = insertObj;
  return await lotItemModel.findByIdAndUpdate(id, updateData, { new: true });
},
findAndDelete: async (id) => {
  return await lotItemModel.findByIdAndDelete(id);
},







}
  
export default lotItemServices;
