import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js";
import { multerMiddleware } from "../../../../helper/multer.js"

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
        ]).fields([{ name: "lotImage", maxCount: 5 }]),
        auth.verifyToken,
        controller.createLotItem
    )
   
  







