import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"


export default Express.Router()
    .post("/createProduct", auth.verifyToken, controller.createProduct)
    .put("/updateProduct/:productId", auth.verifyToken, controller.updateProduct)
 
