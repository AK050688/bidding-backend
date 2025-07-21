import apiError from "../../../../helper/apiError.js";
import controller from "../lotItem/controler.js";
import mongoose from "mongoose";
import responseMessages from "../../..../../../../../assets/responseMessages.js";
import successResponse from "../../../../../assets/response.js";
import { conditionType } from "../../../../enums/conditionType.js";
import userServices from "../../services/user.js";
import { userType } from "../../../../enums/userType.js";
import { status } from "../../../../enums/status.js";
import bidModel from "../../../../models/bidschema.js";
import lotItemService from "../../services/lotItem.js";
import Joi from "joi";
import lot from "../../services/lot.js";
import sellerServices from "../../services/sellers.js";
import lotItemServices from "../../services/lotItem.js";
const {
  createlot,
  findlot,
  findAllLot,
  findLotByFilter,
  findLotById,
  updateLotById,
  findActiveLots,
  findExpiredLots,
  findlots,
  findById,
} = lot;
const { sellerFindById } = sellerServices;
const { findAdmin } = userServices;
const { createRequest, findOnlySingleLot, findLotItem } = lotItemServices;

export class lotController {
  // async createLot(req, res, next) {
  //     const schema = Joi.object({
  //         sellerId: Joi.string().required(),
  //         productName: Joi.string().required(),
  //         totalBrand: Joi.string().required(),
  //         categoryId: Joi.string().required(),
  //         floorPrice: Joi.number().required(),
  //         lotQuantity: Joi.number().required(),
  //         totalPrice: Joi.number().required(),
  //         maxBidAmount: Joi.number().required(),
  //         startDate: Joi.date().required(),
  //         endDate: Joi.date().required(),
  //         conditionType: Joi.string()
  //             .valid(...Object.values(conditionType))
  //             .required(),
  //         location: Joi.string().required(),
  //         description: Joi.string().optional(),
  //         // Lot Item fields
  //         brandName: Joi.string().required(),
  //         quantity: Joi.number().required(),
  //         perUnitPrice: Joi.number().required(),
  //     });

  //     try {
  //         const { error, value } = schema.validate(req.body);
  //         if (error) {
  //             throw apiError.badRequest(error.details[0].message);
  //         }

  //         const seller = await sellerFindById(value.sellerId);
  //         if (!seller) {
  //             throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
  //         }

  //         let lotImage = [];
  //         if (req.files && req.files.lotImage && req.files.lotImage.length > 0) {
  //             lotImage = req.files.lotImage.map((file) => `/${file.filename}`);
  //         }

  //         const {
  //             productName,
  //             totalBrand,
  //             sellerId,
  //             categoryId,
  //             floorPrice,
  //             totalPrice,
  //             lotQuantity,
  //             maxBidAmount,
  //             startDate,
  //             endDate,
  //             conditionType,
  //             location,
  //             description,
  //             brandName,
  //             quantity,
  //             perUnitPrice,
  //         } = value;

  //         // 1. First create the Lot document
  //         const newLot = await createlot({
  //             productName,
  //             totalBrand,
  //             lotImage,
  //             lotItemId: [],
  //             sellerId,
  //             categoryId,
  //             floorPrice,
  //             totalPrice,
  //             maxBidAmount,
  //             lotQuantity,
  //             startDate,
  //             endDate,
  //             conditionType,
  //             location,
  //             description,
  //         });

  //         const newLotItem = await createRequest({
  //             lotId: newLot._id, // Reference to the parent Lot
  //             brandName,
  //             quantity,
  //             perUnitPrice,
  //             sellerId,
  //             description: description || "No description provided",
  //             productImage: lotImage.length > 0 ? lotImage[0] : "/default.jpg",
  //         });

  //         // 3. Update the Lot to include the Lot Item reference
  //         await updateLotById(newLot._id, {
  //             $push: { lotItemId: newLotItem._id }
  //         });
  //         const updatedLot = await findLotById(newLot._id);

  //         return res.json(
  //             new successResponse(
  //                 {
  //                     lot: updatedLot,
  //                     lotItem: newLotItem
  //                 },
  //                 responseMessages.LOT_CREATED
  //             )
  //         );

  //     } catch (error) {
  //         console.error("Error in createLot:", error);
  //         next(error);
  //     }
  // }

  async createLot(req, res, next) {
    const schema = Joi.object({
      sellerId: Joi.string().required(),
      productName: Joi.string().required(),
      totalBrand: Joi.string().required(),
      categoryId: Joi.string().required(),
      floorPrice: Joi.number().required(),
      lotQuantity: Joi.number().required(),
      totalPrice: Joi.number().required(),
      maxBidAmount: Joi.number().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      conditionType: Joi.string()
        .valid(...Object.values(conditionType))
        .required(),
      location: Joi.string().required(),
      description: Joi.string().optional(),
      lotItems: Joi.string().required(), // treat it as a stringified JSON
    });

    try {
      const { error, value } = schema.validate(req.body);
      if (error) {
        throw apiError.badRequest(error.details[0].message);
      }

      const seller = await sellerFindById(value.sellerId);
      if (!seller) {
        throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
      }

      let lotImage = [];
      if (req.files?.lotImage?.length > 0) {
        lotImage = req.files.lotImage.map((file) => `/${file.filename}`);
      }

      const {
        productName,
        totalBrand,
        sellerId,
        categoryId,
        floorPrice,
        totalPrice,
        lotQuantity,
        maxBidAmount,
        startDate,
        endDate,
        conditionType,
        location,
        description,
        lotItems,
      } = value;

      let parsedLotItems;
      try {
        parsedLotItems = JSON.parse(lotItems);
        if (!Array.isArray(parsedLotItems)) {
          throw new Error("lotItems must be a JSON array.");
        }
      } catch (e) {
        throw apiError.badRequest("Invalid JSON format for lotItems.");
      }

      // 1. Create Lot
      const newLot = await createlot({
        productName,
        totalBrand,
        lotImage,
        lotItemId: [],
        sellerId,
        categoryId,
        floorPrice,
        totalPrice,
        maxBidAmount,
        lotQuantity,
        startDate,
        endDate,
        conditionType,
        location,
        description,
      });

      // 2. Create lotItems using forEach and Promise.all
      const lotItemIds = [];

      const promises = [];
      parsedLotItems.forEach((item) => {
        if (
          !item.brandName ||
          isNaN(item.quantity) ||
          isNaN(item.perUnitPrice)
        ) {
          throw apiError.badRequest(
            "Missing or invalid brandName, quantity or perUnitPrice in lotItems."
          );
        }

        const promise = createRequest({
          lotId: newLot._id,
          brandName: item.brandName,
          quantity: item.quantity,
          perUnitPrice: item.perUnitPrice,
          sellerId,
          description: description || "No description provided",
          productImage: lotImage.length > 0 ? lotImage[0] : "/default.jpg",
        }).then((lotItem) => {
          lotItemIds.push(lotItem._id);
        });

        promises.push(promise);
      });

      await Promise.all(promises);

      // 3. Push lotItemIds to Lot
      await updateLotById(newLot._id, {
        $set: { lotItemId: lotItemIds },
      });

      const updatedLot = await findLotById(newLot._id);

      return res.json(
        new successResponse(
          { lot: updatedLot, lotItemIds },
          responseMessages.LOT_CREATED
        )
      );
    } catch (error) {
      console.error("Error in createLot:", error);
      next(error);
    }
  }

  async getAllLots(req, res, next) {
    try {
      const { status, conditionType, categoryId } = req.query;
      const query = {};

      //  Status filtering
      const now = new Date();
      if (status === "ACTIVE") {
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
        query.isSold = false;
      } else if (status === "BLOCKED") {
        query.endDate = { $lt: now };
        query.isSold = false;
      } else if (status === "isSold") {
        query.isSold = true;
      }

      //  Filter by conditionType
      if (conditionType) {
        query.conditionType = conditionType;
      }

      //  Filter by categoryId
      if (categoryId) {
        query.categoryId = categoryId;
      }

      const lots = await findLotByFilter(query);

      return res.json(new successResponse(lots, responseMessages.LOT_FETCHED));
    } catch (error) {
      next(error);
    }
  }
  async getLotById(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(apiError.badRequest(responseMessages.INVALID));
      }

      const lot = await findLotById(id);

      if (!lot) {
        return next(apiError.notFound(responseMessages.LOT_NOT_FOUND));
      }

      return res.json(
        new successResponse(
          {
            lot,
          },
          responseMessages.LOT_FETCHED
        )
      );
    } catch (error) {
      console.error("Error in getLotById:", error);
      next(error);
    }
  }
  async updateLot(req, res, next) {
    const schema = Joi.object({
      productName: Joi.string().optional(),
      totalBrand: Joi.string().optional(),
      lotItemId: Joi.array().items(Joi.string()).optional(),
      categoryId: Joi.string().optional(),
      floorPrice: Joi.number().optional(),
      totalPrice: Joi.number().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      conditionType: Joi.string()
        .valid(...Object.values(conditionType))
        .optional(),
      location: Joi.string().optional(),
      description: Joi.string().optional(),
      isSold: Joi.boolean().optional(),
    });

    try {
      const { error, value } = schema.validate(req.body);
      if (error) {
        return next(apiError.badRequest(error.details[0].message));
      }

      const lotId = req.params.id;
      const adminDetails = await findAdmin(req.userId);
      if (!adminDetails || adminDetails.userType !== userType.ADMIN) {
        return next(apiError.forbidden(responseMessages.ADMIN_UPDATE_LOT));
      }

      const existingLot = await findLotById(lotId);
      if (!existingLot) {
        return next(apiError.notFound(responseMessages.LOT_NOT_FOUND));
      }
      let query = {};
      console.log(value.productName);

      if (value.productName) {
        query.productName = value.productName;
      }

      if (value.totalBrand) {
        query.totalBrand = value.totalBrand;
      }
      if (value.lotItemId) {
        query.lotItemId = value.lotItemId;
      }
      if (value.categoryId) {
        query.categoryId = value.categoryId;
      }
      if (value.floorPrice) {
        query.floorPrice = value.floorPrice;
      }
      if (value.totalPrice) {
        query.totalPrice = value.totalPrice;
      }
      if (value.lotImage) {
        query.lotImage = value.lotImage;
      }
      if (value.conditionType) {
        query.conditionType = value.conditionType;
      }
      if (value.location) {
        query.location = value.location;
      }
      if (value.description) {
        query.description = value.description;
      }
      const updated = await updateLotById(lotId, query);
      return res.json(
        new successResponse(updated, responseMessages.LOT_UPDATE)
      );
    } catch (err) {
      console.error("Error in updateLot:", err);
      next(err);
    }
  }

  async getActiveLots(req, res, next) {
    const schema = Joi.object({
      buyerId: Joi.string().optional(),
    });
    try {
      const { error, value } = schema.validate(req.query);
      if (error) {
        throw apiError.badRequest(error.details[0].message);
      }
      const { buyerId } = value;
      if (buyerId && !mongoose.Types.ObjectId.isValid(buyerId)) {
        throw apiError.badRequest(responseMessages.INVALID);
      }

      const lots = await findActiveLots();
      return res.json(
        new successResponse(lots, responseMessages.ACTIVE_LOTS_FETCHED)
      );
    } catch (error) {
      console.error("Error in getActiveLots:", error);
      next(apiError.internal(error.message));
    }
  }
  async getExpiredLots(req, res, next) {
    const schema = Joi.object({
      buyerId: Joi.string().optional(),
    });
    try {
      const { error, value } = schema.validate(req.query);
      if (error) {
        return next(apiError.badRequest(error.details[0].message));
      }
      const { buyerId } = value;
      if (buyerId && !mongoose.Types.ObjectId.isValid(buyerId)) {
        return next(apiError.badRequest(responseMessages.INVALID));
      }
      const lots = await findExpiredLots();

      return res.json(
        new successResponse(lots, responseMessages.EXPIRED_LOTS_FETCHED)
      );
    } catch (error) {
      console.error("Error in getExpiredLots:", error);
      next(apiError.internal(error.message));
    }
  }
  async getSoldLots(req, res, next) {
    const schema = Joi.object({
      buyerId: Joi.string().optional(),
    });
    try {
      const { error, value } = schema.validate(req.body);
      if (error) {
        throw apiError.badRequest(error.details[0].message);
      }
      const { buyerId } = value;
      if (buyerId && !mongoose.Types.ObjectId.isValid(buyerId)) {
        throw apiError.badRequest(responseMessages.INVALID);
      }
      const userId = req.userId;

      const lots = await findlots({ sellerId: userId, isSold: true });

      if (!lots || lots.length === 0) {
        return next(apiError.notFound(responseMessages.LOT_NOT_FOUND));
      }

      return res.json(new successResponse(lots, responseMessages.LOT_FETCHED));
    } catch (error) {
      console.error("Error in getSoldLots:", error);
      next(error);
    }
  }
  async chooseWinner(req, res, next) {
    const schema = Joi.object({
      lotId: Joi.string().hex().length(24).required(),
    });

    try {
      const { error, value } = schema.validate(req.params);
      if (error) {
        throw apiError.badRequest(error.message);
      }

      const { lotId } = value;

      const lot = await lotModel.findById(lotId);
      if (!lot) throw apiError.notFound(responseMessages.LOT_NOT_FOUND);
      if (lot.isSold) throw apiError.badRequest(responseMessages.LOT_SOLD);

      const topBid = await bidModel.findOne({ lotId }).sort({ bidAmount: -1 });

      if (!topBid)
        return next(apiError.notFound("No bids placed on this lot."));

      await lotModel.findByIdAndUpdate(lotId, {
        winnerId: topBid.buyerId,
        isSold: true,
      });

      return res.json(
        new successResponse(
          {
            lotId,
            bidId: topBid._id,
            buyerId: topBid.buyerId,
            bidAmount: topBid.bidAmount,
            winnerId: topBid.buyerId,
            isSold: true,
          },
          "Winner selected successfully for this lot."
        )
      );
    } catch (error) {
      console.error("Error choosing winner:", error);
      return next(apiError.internal("Server error while choosing winner."));
    }
  }
}
export default new lotController();
