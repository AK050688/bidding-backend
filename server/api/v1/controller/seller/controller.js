import userServices from "../../../v1/services/user.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import bcrypt from "bcrypt";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";


export class userController {
    async requestForSeller(req, res, next) {
        const schema = Joi.object({
            name: Joi.string().min(2).max(30).required(),
            email: Joi.string().lowercase().required(),
            subject: Joi.string().required(),
            orgnizationName: Joi.string().lowercase().required(),
            orgnizationType: Joi.string().lowercase().required(),
            orgnizationPhone: Joi.string().required(),
            orgnizationEmail: Joi.string().lowercase().required(),
            orgnizationWebsite: Joi.string().optional(),
            gstNumber: Joi.string().lowercase().optional(),
            remark: Joi.string().optional(),
        });
        try {
            const validatedBody = await schema.validateAsync(req.body);
            const {
                name,
                email,
                subject,
                remark,
                orgnizationName,
                orgnizationType,
                orgnizationPhone,
                orgnizationEmail,
                orgnizationWebsite,
                gstNumber
            } = validatedBody;


            const checkAlreadyRequested = await checkForRequest(email, orgnizationName,);

            if (user) {
                if (user.status === "BLOCKED") {
                    return res.json(apiError.forbidden(responseMessages.UNAUTHORIZED));
                } else if (user.mobileNumber === mobileNumber) {
                    return res.json(
                        apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST)
                    );
                } else if (user.email === email) {
                    return res.json(
                        apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST)
                    );
                } else {
                    return res.json(
                        apiError.conflict(responseMessages.USER_ALREADY_EXIST)
                    );
                }
            }
            // await commonFunction.sendMail(email, validatedBody.otp);
            const result = await createUser(validatedBody);
            return res.json(
                new successResponse(result, responseMessages.USER_CREATED)
            );
        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
}