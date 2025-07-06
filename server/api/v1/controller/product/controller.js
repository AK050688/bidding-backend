import productServices from "../../../v1/services/product.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";

const {
  findSeller,
  findSellerOrAdmin,
  createProduct,
  updateProduct,
  checkProduct,
  findUserById,
  checkCategory,
  deleteCategory,
  findAllCategory,
  findAdmin,
} = productServices;

class ProductController {
  async createProduct(req, res, next) {
    const fields = Joi.object({
      name: Joi.string().min(3).max(100).required(),
      description: Joi.string().max(500).optional(),
      categoryId: Joi.string().hex().length(24).required(),
      minBid: Joi.number().min(0).required(),
      quantity: Joi.number().integer().min(1).optional(),
      startTime: Joi.date().iso().required(),
      endTime: Joi.date().iso().required(),
    });

    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }
      const {
        name,
        description,
        categoryId,
        minBid,
        quantity,
        startTime,
        endTime,
      } = value;
      const user = await findUserById(req.userId);
      if (!user) {
        return res.json(new apiError.notFound(responseMessages.USER_NOT_FOUND));
      }
      if (![userType.ADMIN, userType.BUYER].includes(user.userType)) {
        return res.json(apiError.forbidden(responseMessages.UNAUTHORIZED));
      }
      if (user.userType === userType.SELLER) {
        const sellerDetails = await findSeller(req.userId);
        if (!sellerDetails) {
          return res.json(apiError.notFound(responseMessages.SELLER_NOT_FOUND));
        }
        if (sellerDetails.statusOfApproval !== statusOfApproval.ACCEPTED) {
          return res.json(
            apiError.forbidden(responseMessages.NOT_ALLOWED_TO_CREATE_PRODUCT)
          );
        }
      }
      const sellerId = req.userId;
      const productData = {
        sellerId,
        user,
        name,
        description,
        categoryId,
        minBid,
        quantity,
        startTime,
        endTime,
      };
      const createdProduct = await productServices.createProduct(productData);

      return res.json(
        new successResponse(createdProduct, responseMessages.PRODUCT_ADDED)
      );
    } catch (error) {
      console.log("Error creating product:", error);
      return next(error);
    }
  }

  async updateProduct(req, res, next) {
    const fields = Joi.object({
      name: Joi.string().min(3).max(100).optional(),
      description: Joi.string().max(500).optional(),
      categoryId: Joi.string().hex().length(24).optional(),
      minBid: Joi.number().min(0).optional(),
      quantity: Joi.number().integer().min(1).optional(),
      startTime: Joi.date().iso().optional(),
      endTime: Joi.date().iso().optional(),
    });

    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }

      const productId = req.params.productId;
      const isProduct = await checkProduct(productId);
      if (!isProduct) {
        return res.json(apiError.notFound(responseMessages.PRODUCT_NOT_FOUND));
      }

      const currentTime = new Date();
      if (currentTime >= isProduct.startTime || isProduct.isSold) {
        return res.json(
          apiError.badRequest(responseMessages.BID_OVER_OR_SOLD_OR_STARTED)
        );
      }

      if (value.categoryId) {
        const category = await checkCategory(value.categoryId);
        if (!category) {
          return res.json(
            apiError.badRequest(responseMessages.CATEGORY_NOT_FOUND)
          );
        }
      }

      const user = await findUserById(req.userId);
      if (!user) {
        return res.json(new apiError.notFound(responseMessages.USER_NOT_FOUND));
      }

      const sellerOrAdmin = await findSellerOrAdmin(req.userId);
      if (!sellerOrAdmin) {
        return res.json(apiError.forbidden(responseMessages.UNAUTHORIZED));
      }
      if (
        sellerOrAdmin.userType !== userType.ADMIN &&
        isProduct.sellerId !== req.userId
      ) {
        return res.json(apiError.forbidden(responseMessages.PRODUCT_NOT_YOURS));
      }
      const updatedProduct = await updateProduct(productId, value);

      return res.json(
        new successResponse(updatedProduct, responseMessages.PRODUCT_UPDATED)
      );
    } catch (error) {
      console.log("Error updating product:", error);
      return next(error.message);
    }
  }
}

export default new ProductController();
