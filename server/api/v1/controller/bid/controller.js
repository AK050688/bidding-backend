import bidServices from "../../../v1/services/bid.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";
import sellerServices from "../../services/sellers.js";
import productServices from "../../services/product.js";
const { findSellerById, updateSellerById, findAllRequest, findSellerByBuyerid } = sellerServices;
const {
  placeBid,
  checkProduct,
  findUserById,
  checkPlacedBid,
  getBidsOnProduct,
  getSellerProductsWithBids,
  getSellerProductsWithEndBids
} = bidServices;

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
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    try {
      const { error, value } = fields.validate(req.query);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }

      const { productId, page, limit } = value;

      const user = await findUserById(req.userId);
      if (!user) {
        return res.json(apiError.notFound(responseMessages.USER_NOT_FOUND));
      }
        const product = await checkProduct(productId);
      
      if (!product) {
         return res.json(apiError.notFound(responseMessages.PRODUCT_NOT_FOUND));
      }
 const currentTime = new Date();
      if (
        currentTime < product.startTime ||
        currentTime > product.endTime ||
        product.isSold
      ) {
         return res.json(apiError.notFound(responseMessages.BIDING_NOT_AVILABLE));
      }
      const result = await getBidsOnProduct(productId, req.userId, {
        page,
        limit,
      });

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
  }
  async getSellerProductsWithLiveBids(req, res, next) {
    const fields = Joi.object({
      buyerId: Joi.string().required(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    try {
      const { error, value } = fields.validate(req.query);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
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
          
          return res.json(apiError.unauthorized(responseMessages.CANT_SEE_PRODUCT))
        }
        const requestingSeller = await findSellerByBuyerid(buyerId);
        if (!requestingSeller) {
          return res.json(apiError.notFound(responseMessages.SELLER_NOT_FOUND))
        }
        if (buyerId.toString() !== requestingSeller.buyerId._id.toString()) {
          return res.json(apiError.unauthorized(responseMessages.CANT_SEE_PRODUCT))
        }
        seller = requestingSeller._id
      }

      const result = await getSellerProductsWithBids(
        seller,
        req.userId,
        { page, limit }
      );

      return res.json(
        new successResponse(
          {
            products: result.products,
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
  async getSellerProductsWithEndedBids(req, res, next) {
    const fields = Joi.object({
      buyerId: Joi.string().required(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    try {
      const { error, value } = fields.validate(req.query);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
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
          
          return res.json(apiError.unauthorized(responseMessages.CANT_SEE_PRODUCT))
        }
        const requestingSeller = await findSellerByBuyerid(buyerId);
        if (!requestingSeller) {
          return res.json(apiError.notFound(responseMessages.SELLER_NOT_FOUND))
        }
        if (buyerId.toString() !== requestingSeller.buyerId._id.toString()) {
          return res.json(apiError.unauthorized(responseMessages.CANT_SEE_PRODUCT))
        }
        seller = requestingSeller._id
      }

      const result = await getSellerProductsWithEndBids(
        seller,
        req.userId,
        { page, limit }
      );

      return res.json(
        new successResponse(
          {
            products: result.products,
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
