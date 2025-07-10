import express from "express";
import controller from "./controller";
import { multerMiddleware } from "../../../../helper/multer";

export default Express.Router()
.post("/submitSupport",auth.verifyToken,controller.submitSupport)
