import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"

export default Express.Router()
    .post("/adminLogin", controller.adminLogin)
    .put("/adminResetPassword", auth.verifyToken, controller.adminResetPassword)
    .get("/paginateAlluserList", auth.verifyToken, controller.paginateAlluserList)
    .get("/dashboard", auth.verifyToken, controller.dashboard)
    .put("/markUserStatus", auth.verifyToken, controller.markUserStatus)
