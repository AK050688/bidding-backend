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
import lotServices from "../../services/lot.js";
import user from "../../../../models/user.js";
import bidService from "../../services/bid.js"
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs"
const { checkForRequest, createRequest, findAllRequest, findSellerById, findAllSeller, sellerFindById } = sellerServices
const { findUserById } = userServices;
const { findlot } = lotServices
const { BidCount } = bidService
export class sellerController {


    async requestForSeller(req, res, next) {
        const schema = Joi.object({
            name: Joi.string().min(2).max(30).required(),
            email: Joi.string().email().required(),
            subject: Joi.string().required(),
            remark: Joi.string().required(),
            orgnizationName: Joi.string().required(),
            orgnizationType: Joi.string().required(),
            orgnizationPhone: Joi.string().required(),
            orgnizationEmail: Joi.string().email().required(),
            orgnizationWebsite: Joi.string().optional(),
            gstNumber: Joi.string().required(),

        });

        try {
            const validatedBody = await schema.validateAsync(req.body);
            const {
                name,
                email,
                subject,
                orgnizationName,
                orgnizationType,
                orgnizationPhone,
                orgnizationEmail,
                orgnizationWebsite,
                gstNumber
            } = validatedBody;

            const user = await findUserById(req.userId);
            if (!user) {
                throw apiError.notFound(responseMessages.USER_NOT_FOUND);
            }
            console.log();

            // Extract file paths from req.files
            if (req.files) {
                validatedBody.pan_Image = req.files?.pan_Image?.[0]?.filename || null;
                validatedBody.aadhar_Image = req.files?.aadhar_Image?.[0]?.filename || null;
                validatedBody.gstDoc_Image = req.files?.gstDoc_Image?.[0]?.filename || null;
            }

            validatedBody.buyerId = req.userId;

            const checkAlreadyRequested = await checkForRequest(email, orgnizationPhone, gstNumber);

            if (checkAlreadyRequested) {
                if (checkAlreadyRequested.status === "PENDING") {
                    throw apiError.forbidden(responseMessages.REQUEST_ALREADY_PENDING);
                } else if (checkAlreadyRequested.orgnizationPhone === orgnizationPhone) {
                    throw apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST);
                } else if (checkAlreadyRequested.status === "REJECTED") {
                    const result = await createRequest(validatedBody);
                    // 👉 Update user as seller after REAPPLY
                    await updateUserById(req.userId, { isSeller: true });
                    return res.json(new successResponse(result, responseMessages.REAPPLIED_REQUEST));


                } else if (checkAlreadyRequested.status === "BLOCK") {
                    throw apiError.conflict(responseMessages.REQUEST_BLOCKED);
                } else if (checkAlreadyRequested.email === email) {
                    throw apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST);
                } else if (checkAlreadyRequested.gstNumber === gstNumber) {
                    throw apiError.conflict(responseMessages.GST_ALREADY_EXIST);
                } else {
                    throw apiError.conflict(responseMessages.REQUEST_ALREADY_EXIST);
                }
            }

            const result = await createRequest(validatedBody);
            return res.json(new successResponse(result, responseMessages.REQUEST_APPLIED));
        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
    async downloadDocument(req, res, next) {
        try {
            const { requestId, docType } = req.params;
            if (!requestId || !docType) {
                throw apiError.badRequest(responseMessages.INVALID_FIELDS)
            }

            const allowedDocs = ["pan_Image", "aadhar_Image", "gstDoc_Image"];
            if (!allowedDocs.includes(docType)) {
                throw apiError.badRequest("Invalid document type.");
            }

            const seller = await findSellerById(requestId);
            if (!seller) {
                throw apiError.notFound("Document or seller request not found.");
            }


            if (
                req.userType !== userType.ADMIN &&
                seller.buyerId._id.toString() !== req.userId.toString()
            ) {
                throw apiError.forbidden("Access denied. Not authorized to download this document.");
            }
            //   const filePath = path.join(process.cwd(), seller[docType]);

            console.log(seller, ">>>>>>>>>>>>>>>");
            let doc = {}
            if (docType == "pan_Image") {
                doc = seller.pan_Image
            } else if (docType == "gstDoc_Image") {
                doc = seller.gstDoc_Image

            }
            else if (docType == "aadhar_Image") {
                doc = seller.aadhar_Image
            }
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            const filePath = path.join(
                __dirname,
                "..",
                "..",
                "..",
                "..",
                "..",
                "uploader",
                doc
            );
            console.log(filePath, "???????????");



            if (!fs.existsSync(filePath)) {
                throw apiError.notFound("File not found on server.");
            }

            return res.download(filePath);
        } catch (error) {
            console.error("Download error:", error.message);
            return next(error);
        }
    }
    async getRequestByUser(req, res, next) {
        const schema = Joi.object({
            buyerId: Joi.string().required(),
        });

        try {
            const { buyerId } = await schema.validateAsync(req.params);
            const buyer = await findUserById(buyerId);
            if (!buyer) {
                return next(apiError.notFound(responseMessages.BUYER_ID_NOT_FOUND));
            }
            const sellerRequest = await findSellerById(buyerId);
            // console.log(sellerRequest,"======================");


            if (!sellerRequest) {
                return next(apiError.notFound(responseMessages.SELLER_REQUEST_NOT_FOUND));
            }
            // You can combine both buyer & seller data if needed
            return res.json(new successResponse(sellerRequest, responseMessages.DATA_FOUND));

        } catch (error) {
            console.log("Error in getRequestByUser:", error);
            return next(error);
        }
    }
    async getSellerCountBid(req, res, next) {
        try {
            const sellerId = req.params.id;
            const seller = await sellerFindById(sellerId);
            if (!seller) {
                throw apiError.notFound(responseMessages.SELLER_NOT_FOUND)
            }
            const lots = await findlot({ sellerId });
                    console.log(lots,"=========================>");

            const lotDataWithBidCounts = await Promise.all(
                lots.map(async (lot) => {
                    // console.log(lot,"=========================>");
                    
                    const bidCount = await BidCount({ lotId: lot._id });
                    return {
                        lotId: lot._id,
                        productName: lot.productName,
                        totalBrand: lot. totalBrand,
                        floorPrice: lot.floorPrice,
                        totalPrice:lot.totalPrice,
                        maxBidAmount:lot.maxBidAmount,
                        location:lot.location,
                        categoryName:lot.categoryName,
                        lotImage:lot.lotImage,
                        lotItemId:lot.lotItemId,
                        totalBids: bidCount
                    };
                })
            );
            const data = {
                seller: {
                    id: seller._id,
                    name: seller.name,
                    email: seller.email,
                },
                lots: lotDataWithBidCounts
            }
            return res.json(new successResponse(lots, responseMessages.SELLER_LOT_FOUND));




        } catch (error) {
            console.error("Error in getSellerById:", error);
            return next(error);

        }
    }






}





export default new sellerController();