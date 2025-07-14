import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"

export default Express.Router()
    .post("/adminLogin", controller.adminLogin)
    .put("/adminResetPassword", auth.verifyToken, controller.adminResetPassword)
    .get("/paginateAlluserList", auth.verifyToken, controller.paginateAlluserList)
    // .get("/dashboard", auth.verifyToken, controller.dashboard)
    .put("/markUserStatus", auth.verifyToken, controller.markUserStatus)
    .put("/requestApproval", auth.verifyToken, controller.requestApproval)
    .get("/getAllRequest", auth.verifyToken, controller.getAllRequest)
    .get("/getSpecificRequest/:requestId", auth.verifyToken, controller.getSpecificRequest)
    .get('/userCountData',auth.verifyToken,controller.userCountData)
    .delete('/adminDeleteUser',auth.verifyToken,controller.adminDeleteUser)
    .put('/markSellerStatus',auth.verifyToken,controller.markSellerStatus);
   





    