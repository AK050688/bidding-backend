import userServices from "../../../v1/services/user.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import bcrypt from "bcrypt";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";
import sellerServices from "../../../v1/services/sellers.js";
const { checkForRequest, createRequest, findUserById } = sellerServices
export class sellerController {
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

            const user = await findUserById(req.userId);
            // console.log(req.userId);

            if (!user) {
                throw apiError.notFound(responseMessages.USER_NOT_FOUND)
            }
            validatedBody.buyerId = req.userId;
            const checkAlreadyRequested = await checkForRequest(email, orgnizationPhone, gstNumber);

            if (checkAlreadyRequested) {
                if (checkAlreadyRequested.status === "PENDING") {
                    throw apiError.forbidden(responseMessages.REQUEST_ALREADY_PENDING)
                } else if (checkAlreadyRequested.orgnizationPhone === orgnizationPhone) {
                    throw apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST)
                }
                else if (checkAlreadyRequested.status === "REJECTED") {
                    const result = await createRequest(validatedBody);
                    return res.json(
                        new successResponse(result, responseMessages.REAPPLIED_REQUEST)
                    );
                }
                else if (checkAlreadyRequested.status === "BLOCK") {
                    throw apiError.conflict(responseMessages.REQUEST_BLOCKED)

                }
                else if (checkAlreadyRequested.email === email) {
                    throw apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST)

                } else if (checkAlreadyRequested.gstNumber === gstNumber) {
                    throw apiError.conflict(responseMessages.GST_ALREADY_EXIST)

                } else {
                    throw apiError.conflict(responseMessages.REQUEST_ALREADY_EXIST)
                }
            }
            // await commonFunction.sendMail(email, validatedBody.otp);
            const result = await createRequest(validatedBody);
            return res.json(
                new successResponse(result, responseMessages.REQUEST_APPLIED)
            );
        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
}

export default new sellerController();