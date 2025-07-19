import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"

export default Express.Router()
    .post("/placeBid", auth.verifyToken, controller.placeBid)
    .get("/getBidOnlot", auth.verifyToken, controller.getBidOnlot)
    .get("/getSellerLotsWithLiveBids", auth.verifyToken, controller.getSellerLotsWithLiveBids)
    .get("/getSellerLotsWithEndedBids", auth.verifyToken, controller.getSellerLotsWithEndedBids)







