import bidServices from "../../../v1/services/bid.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";

const { placeBid, checkProduct, findUserById, findAdmin, checkPlacedBid } =
  bidServices;

class bidController {
  async placeBid(req, res, next) {
    const fields = Joi.object({
      productId: Joi.string().hex().length(24).required(),
      bidAmount: Joi.number().min(0).required(),
    });

    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }

      const { productId, bidAmount } = value;

      const user = await findUserById(req.userId);
      if (!user) {
        return res.json(new apiError.notFound(responseMessages.USER_NOT_FOUND));
      }

      // if (user.userType !== userType.BUYER) {
      //   return res.json(apiError.forbidden(responseMessages.UNAUTHORIZED));
      // }
      const isProduct = await checkProduct(productId);
      if (!isProduct) {
        return res.json(apiError.notFound(responseMessages.PRODUCT_NOT_FOUND));
      }
      const currentTime = new Date();
      if (
        currentTime < isProduct.startTime ||
        currentTime > isProduct.endTime ||
        isProduct.isSold
      ) {
        return res.json(
          apiError.notFound(responseMessages.BIDING_NOT_AVILABLE)
        );
      }
      if (bidData.bidAmount < isProduct.minBid) {
        return res.json(apiError.notFound(responseMessages.BID_ALREADY_PLACED));
      }
      const isAlreadyBid = checkPlacedBid(req.userId, productId);
      if (isAlreadyBid) {
        return res.json(
          apiError.badRequest(responseMessages.BIDING_NOT_AVILABLE)
        );
      }
      const buyerId = req.userId;
      const bidData = { productId, bidAmount, buyerId };
      const newBid = await placeBid(bidData);

      return res.json(new successResponse(newBid, responseMessages.BID_PLACED));
    } catch (error) {
      console.log("Error placing bid:", error);
      return next(error);
    }
  }
  async getBidOnProduct(req, res, next) {
    const fields = Joi.object({
      productId: Joi.string().hex().length(24).required(),
      buyerId: Joi.string().hex().length(24).required(),
    });

    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }

      const { productId,buyerId } = value;

      const user = await findUserById(buyerId);
      if (!user) {
        return res.json(new apiError.notFound(responseMessages.USER_NOT_FOUND));
      }
console.log(user,">>>>>");

      if (!user.userType == userType.BUYER || !user.userType == userType.ADMIN ) {
        return res.json(apiError.forbidden(responseMessages.UNAUTHORIZED));
      }
      const isProduct = await checkProduct(productId);
      if (!isProduct) {
        return res.json(apiError.notFound(responseMessages.PRODUCT_NOT_FOUND));
      }


      const isAlreadyBid = checkPlacedBid(buyerId, productId);
      return res.json(new successResponse(isAlreadyBid, responseMessages.SUCCESS));
    } catch (error) {
      console.log("Error placing bid:", error);
      return next(error);
    }
  }
}

export default new bidController();
