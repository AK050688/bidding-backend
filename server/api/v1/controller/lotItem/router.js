import Express from "express";
import controller from "./controler.js";
import auth from "../../../../helper/auth.js"
import {multerMiddleware} from "../../../../helper/multer.js";

export default Express.Router()
    .post(
        "/createLotItem",
        multerMiddleware("public", [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".webp",
        ]).fields([{ name: "productImage", maxCount: 1 }]),
        // auth.verifyToken,
        controller.createLotItem
    )
    .get("/getAllLotItems", controller.getAllLotItems)
    .get("/getLotItemById/:lotItemId", controller.getLotItemById)
    .put("/updateLotItem/:id", controller.updateLotItem)
    .delete("/deleteLotItem/:id", controller.deleteLotItem)
   
  







