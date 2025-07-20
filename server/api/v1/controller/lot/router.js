import Express from "express";
import controller from "./controller.js";
import { multerMiddleware } from "../../../../helper/multer.js";
import auth from "../../../../helper/auth.js";

export default Express.Router()
    .post(
        "/createLot",
        multerMiddleware("public", [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".webp",
        ]).fields([{ name: "lotImage", maxCount: 5 }]),
        // auth.verifyToken,
        controller.createLot
    )
    .get("/getAllLots", controller.getAllLots)
    .get("/getLotById/lotId/:id", auth.verifyToken, controller.getLotById)
    .put("/updateLot/:id", auth.verifyToken, controller.updateLot)
    .get("/getActiveLots", auth.verifyToken, controller.getActiveLots)
    .get("/getExpiredLots", auth.verifyToken, controller.getExpiredLots)
    .get("/getSoldLots", auth.verifyToken, controller.getSoldLots);


   

