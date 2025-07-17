import Express from "express";
import controller from "./controller.js";
import auth from "../../../../helper/auth.js"

export default Express.Router()
.post('/userSignUp', controller.userSignup)
.post('/forgotPassword', controller.forgotPassword)
.put('/otpVerification',controller.otpVerification)
.put('/resendOtp',controller.resendOtp)
.put('/passwordChange',controller.passwordChange)
.post('/userLogin',controller.userLogin)
.get("/getProfile",auth.verifyToken,controller.getProfile)
.put("/userEditProfile",auth.verifyToken,controller.userEditProfile) 
.put("/reSetPassword",auth.verifyToken,controller.reSetPassword)
.get("/getBuyerBidCount",auth.verifyToken,controller.getBuyerBidCount)
.get("/buyer/:buyerId/:count",auth.verifyToken,controller.getTransactionCountByBuyer)





