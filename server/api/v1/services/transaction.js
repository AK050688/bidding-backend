import transactionsModel from "../../../models/transaction.js";

const transactionServices = {


    createRequest: async (insertObj) => {
        return await transactionsModel.create(insertObj);
    },

}
export default transactionServices;
