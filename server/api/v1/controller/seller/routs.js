import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"

export default Express.Router()
.post("/requestForSeller",auth.verifyToken,controller.requestForSeller)





