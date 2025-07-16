import apiError from "../../../../helper/apiError";
import responseMessages from "../../../../../assets/responseMessages.js";
import successResponse from "../../../../../assets/response.js";
import Joi from "joi";
import lotItemServices from "../../services/lotItem.js";
const { createRequest, findLotItemById } = lotItemServices;




export class lotItemController{
 async createLotItem (req, res, next){
    const fields = Joi.object({
        productName: Joi.string().required(),
        brandName: Joi.string().required(),
        quantity: Joi.number().required(),
        perUnitPrice: Joi.number().required(),
        productImage: Joi.string().required(),
    })
  try {
    const { error, value } = fields.validate(req.body);
    if (error) {
      console.error(error.details);
      return res.status(400).json({ error: error.message });
    }
    if (!req.files || !req.files.lotImage || req.files.lotImage.length === 0) {
      throw apiError.badRequest(responseMessages.LOT_ITEM_IMAGE_REQUIRED);
    }
    const { productName, brandName, quantity, perUnitPrice, productImage } = req.body;

    const newItem = await createRequest({
      productName,
      brandName,
      quantity,
      perUnitPrice,
      productImage,
    });

    res.status(201).json({ success: true, message: "Lot item created", data: newItem });
  } catch (error) {
    next(error);
  }
};

}
export default new lotItemController();