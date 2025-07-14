import Express from "express";
import controller from "./controller.js";

export default Express.Router()
.post("/createOrder",controller.createOrder)
.post("/verifyAndStoreTransaction",controller.verifyAndStoreTransaction);