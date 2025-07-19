import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js";
import { multerMiddleware } from "../../../../helper/multer.js"

export default Express.Router()
.post("/requestForSeller",multerMiddleware("uploader", [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
  ]).fields([
    { name: "pan_Image", maxCount: 1 },
    { name: "aadhar_Image", maxCount: 1 },
    { name: "gstDoc_Image", maxCount: 1 },
  ]),auth.verifyToken,controller.requestForSeller)
 .get("/getRequestByUser/:buyerId", controller.getRequestByUser)
 .get(
  "/downloadDocument/:requestId/:docType",
  auth.verifyToken,
  controller.downloadDocument
)








