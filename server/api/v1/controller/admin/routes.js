import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"

export default Express.Router()
    .post("/adminLogin", controller.adminLogin)
    .put("/adminResetPassword", auth.verifyToken, controller.adminResetPassword)
    .get("/paginateAlluserList", auth.verifyToken, controller.paginateAlluserList)
    .put("/markUserStatus", auth.verifyToken, controller.markUserStatus) 
    .put("/requestApproval", auth.verifyToken, controller.requestApproval)
    .post("/getAllRequest", auth.verifyToken, controller.getAllRequest) 
    .get("/getSpecificRequest/:buyerId", auth.verifyToken, controller.getSpecificRequest)
    .get('/userCountData',auth.verifyToken,controller.userCountData)
    .delete('/adminDeleteUser',auth.verifyToken,controller.adminDeleteUser)
    .put('/markSellerStatus',auth.verifyToken,controller.markSellerStatus)
    .get("/Dashboard", auth.verifyToken, controller.Dashboard)
    .get("/getAllBuyers", auth.verifyToken,controller.getAllBuyers)
    .get("/getAllSeller",auth.verifyToken,controller.getAllSeller)
    .get("/getAllTransactions", auth.verifyToken, controller.getAllTransactions)
    .get("/getTransactionByOrderId/:orderId", auth.verifyToken, controller.getTransactionByOrderId)

   





    