import successResponse from "../../../../../assets/response.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import { userType } from "../../../../enums/userType.js";
import apiError from "../../../../helper/apiError.js";
import categoryServices from "../../services/category.js";
import Joi from "joi";
import mongoose from "mongoose";

const {
  findSeller,
  createCategory,
  updateCategory,
  findCategory,
  findUserById,
  categoryId,
  deleteCategory,
  findAllCategory,
  findAdmin,
  findProductAssosiatedWithCategory
} = categoryServices;
export class categoryController {

  async createCategory(req, res, next) {
    const fields = Joi.object({
      categoryName: Joi.string().required(),
      description: Joi.string().required(),
    });
    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error(error.details);
        return res.status(400).json({ error: error.message });
      }
      const { categoryName, description } = value;

      const user = await findUserById(req.userId)

      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND)

      }
      if (![userType.ADMIN, userType.BUYER].includes(user.userType)) {
        throw apiError.forbidden(responseMessages.UNAUTHORIZED)
      }
      if (user.userType == userType.SELLER) {
        const sellerDetails = await findSeller(req.userId);
        if (!sellerDetails) {
          return res.json(apiError.notFound(responseMessages.SELLER_NOT_FOUND));
        }

      }
      const existingCategory = await findCategory({
        categoryName: { $regex: `^${categoryName}$`, $options: 'i' },
      });
      if (existingCategory) {
        throw apiError.conflict(responseMessages.CATEGORY_ALREADY_EXISTS)

      }
      const obj = {
        categoryName: categoryName,
        description: description,
      };
      const createdCategory = await createCategory(obj);
      return res.json(
        new successResponse(createdCategory, responseMessages.CATEGORY_CREATED)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }
  async updateCategory(req, res, next) {
    const fields = Joi.object({
      categoryId: Joi.string().required(),
      categoryName: Joi.string().optional(),
      description: Joi.string().optional(),
    });
    try {
      const validatedBody = await fields.validateAsync(req.body);
      const { categoryId, categoryName, description } = validatedBody;

      const adminDetails = await findAdmin(req.userId);

      if (!adminDetails) {
        throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND)
      }
      const categoryResult = await findCategory({ _id: categoryId });
      if (!categoryResult) {
        throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND)
      }
      const data = { categoryName, description };
      if (data) {
        if (data.categoryName) {
          const iscategoryName = await findCategory({
            categoryName: { $regex: `^${categoryName}$`, $options: 'i' },
          });
          if (iscategoryName) {
            throw apiError.conflict(responseMessages.CATEGORY_ALREADY_EXISTS)
          }
        }
        const updatedCategory = await updateCategory(
          { _id: categoryId },
          { $set: data }
        );
        return res.json(
          new successResponse(
            updatedCategory,
            responseMessages.CATEGORY_UPDATED
          )
        );
      } else {
        throw apiError.invalid(responseMessages.INVALID);
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }
  async deleteCategory(req, res, next) {
    const fields = Joi.object({
      categoryId: Joi.string().required(),
    });
    try {
      const validatedBody = await fields.validateAsync(req.params);
      const { categoryId } = validatedBody;
      console.log(validatedBody);

      const adminDetails = await findAdmin(req.userId);

      if (!adminDetails) {
        throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND)
      }
      const categoryResult = await findCategory({ _id: categoryId });
      if (!categoryResult) {
        throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND);
      }

      // const findProductRelatedCategory = await findProductAssosiatedWithCategory({ categoryId: categoryId })
      // console.log(findProductRelatedCategory);

      // if (findProductRelatedCategory.lengt >= 1) {
      //   throw apiError.conflict(responseMessages.CATEGORY_HAS_PRODUCTS)
      // }
      const result = await deleteCategory({ _id: categoryId });
      if (!result) {
        throw apiError.badRequest(responseMessages.CATEGORY_NOT_DELETE)
      }
      return res.json(
        new successResponse(result, responseMessages.CATEGORY_DELETE)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }
  async getAllCategory(req, res, next) {
    try {
      // const adminDetails = await findSeller({ _id: req.userId });
      // if (!adminDetails) {
      //   throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
      // }
      const categoryResult = await findAllCategory();
      if (!categoryResult || categoryResult.length == 0) {
        throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND)

      }
      return res.json(
        new successResponse(categoryResult, responseMessages.CATEGORY_FOUND)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }
}
export default new categoryController();


