import bidServices from "../../../v1/services/bid.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";
import sellerServices from "../../services/sellers.js";

// import productServices from "../../services/product.js";
const { findSellerById, updateSellerById, findAllRequest, findSellerByBuyerid } = sellerServices;
const {
  placeBid,
  islot,
  checklot,
  findUserById,
  checkPlacedBid,
  getBidsOnLot,
  getSellerlotsWithBids,
  getSellerlotsWithEndBids,
  updateLot
} = bidServices;

class bidController {
  async placeBid(req, res, next) {
    const fields = Joi.object({
      lotId: Joi.string().hex().length(24).required(),
      bidAmount: Joi.number().min(0).required(),
    });

    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error(error.details);
        throw apiError.badRequest(error.message);
      }

      const { lotId, bidAmount } = value;

      const user = await findUserById(req.userId);
      if (!user) {

        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      const islot = await checklot(lotId);
      if (!islot) {
        throw apiError.notFound(responseMessages.LOT_NOT_FOUND);
      }
        if (islot.sellerId.toString() === req.userId.toString()) {
      throw apiError.badRequest(responseMessages.SELLER_CAN_NOT_ALLOWED_TO_BID_OWN_LOT);
    }
      const currentTime = new Date();
      if (
        currentTime < islot.startTime ||
        currentTime > islot.endTime ||
        islot.isSold
      ) {
        return res.json(
          apiError.notFound(responseMessages.BIDING_NOT_AVILABLE)
        );
      }
      if (bidAmount < islot.floorPrice) {
        throw apiError.notFound(responseMessages.BID_ALREADY_PLACED);
      }
      const isAlreadyBid = checkPlacedBid(req.userId, lotId);
      if (isAlreadyBid > 0) {
        throw apiError.badRequest(responseMessages.BID_AMOUNT_ATLEAST);
      }
      const bidData = {
        lotId,
        bidAmount,
        buyerId: req.userId,
      };
      const newBid = await placeBid(bidData);
      if (bidAmount < islot.maxBidAmount) {
      await updateLot(lotId, { maxBidAmount: bidAmount });
    }

      return res.json(new successResponse(newBid, responseMessages.BID_PLACED));
    } catch (error) {
      console.log("Error placing bid:", error);
      return next(error);
    }
  }
async getBidOnlot(req, res, next){
  const fields = Joi.object({
    lotId: Joi.string().hex().length(24).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  });

  try {
    const { error, value } = fields.validate(req.query);
    if (error) {
      console.error(error.details);
      throw apiError.badRequest(error.message);
    }

    const { lotId, page, limit } = value;

    const user = await findUserById(req.userId);
    if (!user) {
      throw apiError.notFound(responseMessages.USER_NOT_FOUND);
    }

    const lot = await checklot(lotId);
    if (!lot) {
      throw apiError.notFound(responseMessages.LOT_NOT_FOUND);
    }

    const currentTime = new Date();
    if (
      currentTime < lot.startTime ||
      currentTime > lot.endTime ||
      lot.isSold
    ) {
      throw apiError.badRequest(responseMessages.BIDING_NOT_AVILABLE);
    }

    const result = await getBidsOnLot(lotId, req.userId, { page, limit });

    return res.json(
      new successResponse(
        {
          bids: result.bids,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
        responseMessages.BIDS_FETCHED
      )
    );
  } catch (error) {
    console.log("Error fetching bids:", error);
    return next(error);
  }
};
  async getSellerLotsWithLiveBids(req, res, next) {
    const fields = Joi.object({
      buyerId: Joi.string().required(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    try {
      const { error, value } = fields.validate(req.query);
      if (error) {
        console.error(error.details);
         throw apiError.badRequest(error.message);
      }
      const { buyerId, page, limit } = value;
      const buyer = await findUserById(req.userId)
      if (!buyer) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      let seller = null
      if (buyer.userType !== userType.ADMIN) {

        // For non-admins, verify seller status and ownership
        if (buyerId.toString() !== req.userId.toString()) {
          throw apiError.unauthorized(responseMessages.CANT_SEE_LOT);
        }
        const requestingSeller = await findSellerByBuyerid(buyerId);
        if (!requestingSeller) {
          throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
        }
        if (buyerId.toString() !== requestingSeller.buyerId._id.toString()) {
          throw apiError.unauthorized(responseMessages.CANT_SEE_LOT)
        }
        seller = requestingSeller._id
      }

      const result = await getSellerlotsWithBids(
        seller,
        req.userId,
        { page, limit }
      );

      return res.json(
        new successResponse(
          {
            lots: result.lots,
            pagination: {
              total: result.total,
              page: result.page,
              limit: result.limit,
              totalPages: result.totalPages,
            },
          },
          responseMessages.SELLER_LOT_WITH_BIDS_FETCHED
        )
      );
    } catch (error) {
      console.log("Error fetching seller products with bids:", error);
      return next(error);
    }
  }
  async getSellerLotsWithEndedBids(req, res, next) {
    const fields = Joi.object({
      buyerId: Joi.string().required(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    try {
      const { error, value } = fields.validate(req.query);
      if (error) {
        console.error(error.details);
        throw apiError.badRequest(error.message);
      }
      const { buyerId, page, limit } = value;
      const buyer = await findUserById(req.userId)
      if (!buyer) {
        return res.json(apiError.notFound(responseMessages.USER_NOT_FOUND))
      }
      let seller = null
      if (buyer.userType !== userType.ADMIN) {

        // For non-admins, verify seller status and ownership
        if (buyerId.toString() !== req.userId.toString()) {

          return res.json(apiError.unauthorized(responseMessages.CANT_SEE_LOT));
        }
        const requestingSeller = await findSellerByBuyerid(buyerId);
        if (!requestingSeller) {
          return res.json(apiError.notFound(responseMessages.SELLER_NOT_FOUND))
        }
        if (buyerId.toString() !== requestingSeller.buyerId._id.toString()) {
          return res.json(apiError.unauthorized(responseMessages.CANT_SEE_LOT))
        }
        seller = requestingSeller._id
      }

      const result = await getSellerlotsWithEndBids(
        seller,
        req.userId,
        { page, limit }
      );

      return res.json(
        new successResponse(
          {
            lots: result.lots,
            pagination: {
              total: result.total,
              page: result.page,
              limit: result.limit,
              totalPages: result.totalPages,
            },
          },
          responseMessages.SELLER_PRODUCTS_WITH_BIDS_FETCHED
        )
      );
    } catch (error) {
      console.log("Error fetching seller products with bids:", error);
      return next(error);
    }
  }
}

export default new bidController();
