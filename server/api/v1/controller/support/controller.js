import userServices from "../../../v1/services/user.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import bcrypt from "bcrypt";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";
import supportServices from "../../../v1/services/support.js";
import { supportStatus } from "../../../../enums/supportStatus.JS";

const { checkForSupport, createSupport, findUserById } = supportServices
export class supportController {
    async submitSupport(req, res, next) {
        const schema = Joi.object({
            name: Joi.string().min(2).max(30).required(),
            email: Joi.string().lowercase().required(),
            subject: Joi.string().required(),
            mobileNumber: Joi.string().required(),
            description: Joi.string().required(),

        });
        try {
            const validatedBody = await schema.validateAsync(req.body);
            const {
                name,
                email,
                subject,
                mobileNumber,
                description,
            } = validatedBody;
            const alreadySubmitted = await checkForSupport(email, mobileNumber)

            if (alreadySubmitted) {
                if (alreadySubmitted.supportStatus === supportStatus.PENDING) {
                    return res.json(apiError.conflict(responseMessages.SUPPORT_ALREADY_PENDING))
                } else if (alreadySubmitted.supportStatus === supportStatus.BLOCK) {
                    return res.json(apiError.forbidden(responseMessages.SUPPORT_NOT_ALLOWED))
                }
            }

            // await commonFunction.sendMail(email, validatedBody.otp);
            const result = await createSupport(validatedBody);
            if (result.supportStatus.PENDING)
                return res.json(
                    new successResponse(result, responseMessages.REQUEST_APPLIED)
                );
        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
}

export default new supportController();