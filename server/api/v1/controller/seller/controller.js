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
import user from "../../../../models/user.js";
const { checkForRequest, createRequest, findUserById, findAllRequest } = sellerServices
const { findAdminv2 } = userServices;
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
            gstDoc_Image: Joi.string(),

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
                    return res.json(apiError.forbidden(responseMessages.REQUEST_ALREADY_PENDING));
                } else if (checkAlreadyRequested.orgnizationPhone === orgnizationPhone) {
                    return res.json(
                        apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST)
                    );
                }
                else if (checkAlreadyRequested.status === "REJECTED") {
                    const result = await createRequest(validatedBody);
                    return res.json(
                        new successResponse(result, responseMessages.REAPPLIED_REQUEST)
                    );
                }
                else if (checkAlreadyRequested.status === "BLOCK") {
                    return res.json(
                        apiError.conflict(responseMessages.REQUEST_BLOCKED)
                    );
                }
                else if (checkAlreadyRequested.email === email) {
                    return res.json(
                        apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST)
                    );
                } else if (checkAlreadyRequested.gstNumber === gstNumber) {
                    return res.json(
                        apiError.conflict(responseMessages.GST_ALREADY_EXIST)
                    );
                } else {
                    return res.json(
                        apiError.conflict(responseMessages.REQUEST_ALREADY_EXIST)
                    );
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
    };
    async getAllRequestByUser(req, res, next) {
        const fields = Joi.object({
            statusOfApproval: Joi.string()
                .valid(...Object.values(statusOfApproval))
                .required(),
        })

        try {
            const validate = await fields.validateAsync(req.body);
            const { statusOfApproval } = validate
            const isAdmin = await findAdminv2(req.userId);
            if (!isAdmin) {
                return res.json(
                    apiError.unauthorized(responseMessages.USER_NOT_FOUND)
                );
            }
            const updateStatus = await findAllRequest({ statusOfApproval: statusOfApproval })
            return res.json(new successResponse(updateStatus, responseMessages.SUCCESS))
        } catch (error) {
            console.log("error..", error);
            return next(error)

        }
    };




}





export default new sellerController();