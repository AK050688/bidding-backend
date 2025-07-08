import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"

export default Express.Router()
    .post("/placeBid", auth.verifyToken, controller.placeBid)
    .get("/getBidOnProduct", auth.verifyToken, controller.getBidOnProduct)
    .get("/getSellerProductsWithLiveBids", auth.verifyToken, controller.getSellerProductsWithLiveBids)
    .get("/getSellerProductsWithEndedBids", auth.verifyToken, controller.getSellerProductsWithEndedBids)







