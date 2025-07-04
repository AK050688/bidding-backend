import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"


export default Express.Router()
    .post("/createCategory", auth.verifyToken, controller.createCategory)
    .put("/updateCategory", auth.verifyToken, controller.updateCategory)
    .delete("/deleteCategory/:categoryId", auth.verifyToken, controller.deleteCategory)
    .get("/getAllCategory",  controller.getAllCategory)
