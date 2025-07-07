import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"
import { multerMiddleware } from "../../../../helper/multer.js";


export default Express.Router()
    .post("/createProduct", multerMiddleware("public", [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".webp",
    ]).fields([{ name: "productImage", maxCount: 5 }]), auth.verifyToken, controller.createProduct)
    .put("/updateProduct/:productId", multerMiddleware("public", [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".webp",
    ]).fields([{ name: "productImage", maxCount: 5 }]) ,auth.verifyToken, controller.updateProduct)
    .delete("/deleteProduct/:productId", auth.verifyToken, controller.deleteProduct)
    .get("/getAllProductOfSeller/:buyerId", auth.verifyToken, controller.getAllProductOfSeller)

