import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import successResponse from "../../../../../assets/response.js";
import lotServices from "../../services/lot.js";
import Joi from "joi";
import lotItemServices from "../../services/lotItem.js";
const { createRequest, findLotItem, findByIdAndUpdate, findAndDelete,findLotByIds } = lotItemServices;
const { findLotById } = lotServices;




export class lotItemController {
  async createLotItem(req, res, next) {
    const fields = Joi.object({
      lotId: Joi.string().required(),
      brandName: Joi.string().required(),
      quantity: Joi.number().required(),
      perUnitPrice: Joi.number().required(),
      sellerId: Joi.string().required(),
      description: Joi.string().required(),
    });

    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error("Validation error:", error.details);
        throw apiError.badRequest(error.details[0].message);

      }

      const {
        lotId,
        brandName,
        quantity,
        perUnitPrice,
        sellerId,
        description
      } = value;

      const ifLotIdExists = await findLotById(lotId);
      if (!ifLotIdExists) {
        throw apiError.notFound(responseMessages.LOT_NOT_FOUND)
      }

      if (!req.files || !req.files.productImage || req.files.productImage.length === 0) {
        throw apiError.badRequest(responseMessages.LOT_ITEM_IMAGE_REQUIRED);
      }

      const productImagePath = `/${req.files.productImage[0].filename}`;

      const newItem = await createRequest({
        lotId,
        brandName,
        quantity,
        perUnitPrice,
        sellerId,
        description,
        productImage: productImagePath,
      });

      return res.json(new successResponse(newItem, responseMessages.LOT_ITEM_CREATED));
    } catch (error) {
      console.log("Error in createLotItem:", error);
      return next(error);
    }
  }
  async getAllLotItems(req, res, next) {
    try {
      const items = await findLotItem();
      if (!items || items.length === 0) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      }
      return res.json(new successResponse(items, responseMessages.DATA_FOUND));
    } catch (error) {
      console.error("Error in getAllLotItems:", error);
      next(error);
    }
  };

  async getLotItemById(req, res, next) {
    const schema = Joi.object({
      lotItemId: Joi.string().required(),
    });

    try {
      const { lotItemId } = await schema.validateAsync(req.params);
      const item = await findLotById(lotItemId);
      if (!item) {

        throw apiError.notFound(responseMessages.NOT_FOUND);
      }
      return res.json(new successResponse(item, responseMessages.DATA_FOUND));
    } catch (error) {
      console.error("Error in getLotItemById:", error);
      next(error);
    }
  }

  async updateLotItem(req, res, next) {
  try {
    const lotItemId = req.params.id;

    const existingItem = await findLotByIds(lotItemId);
    console.log(existingItem, "==============================>");
    if (!existingItem) {
      throw apiError.notFound(responseMessages.LOT_ITEM_NOT_FOUND);
    }

    // 🟡 Extract update data from the request body
    const updateData = req.body;

    const updatedLotItem = await findByIdAndUpdate(lotItemId, updateData);
    console.log(updatedLotItem, "================================>>>>>>>>>>>>>");

    if (!updatedLotItem) {
      throw apiError.notFound(responseMessages.LOT_ITEM_NOT);
    }

    return res.json(new successResponse(updatedLotItem, responseMessages.UPDATE_SUCCESS));
  } catch (error) {
    next(error);
  }
}

  async deleteLotItem(req, res, next) {
    try {
      const item = await findAndDelete(req.params.id);
      if (!item) {
        return res.status(404).json(responseMessages.NOT_FOUND);
      }
      return res.json(new successResponse(item, responseMessages.DELETE_SUCCESS));
    } catch (error) {
      next(error);
    }
  };


























































}
export default new lotItemController();