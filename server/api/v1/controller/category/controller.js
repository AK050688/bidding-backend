import successResponse from "../../../../../assets/response.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import apiError from "../../../../helper/apiError.js";
import categoryServices from "../../services/category.js";
import Joi from "joi";
import mongoose from "mongoose";

const {
  findSeller,
  createCategory,
  updateCategory,
  findCategory,
  categoryId,
  deleteCategory,
  findAllCategory,
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
      const adminDetails = await findSeller({ _id: req.userId });
      if (!adminDetails) {
        throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
      }
      const iscategoryName = await findCategory({ categoryName: categoryName });
      if (iscategoryName) {
        throw apiError.conflict(responseMessages.CATEGORY_ALREADY_EXISTS);
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
  /**
   * @swagger
   * /api/v1/category/updateCategory:
   *   put:
   *     summary: admin update category
   *     tags:
   *       - CATEGORY
   *     description: admin can update the category.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authorization
   *         description: authorization
   *         in: header
   *         required: true
   *       - name: categoryId
   *         description: categoryId
   *         in: formData
   *         required: true
   *       - name: categoryName
   *         description: categoryName
   *         in: formData
   *         required: false
   *       - name: description
   *         description: description
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */

  async updateCategory(req, res, next) {
    const fields = Joi.object({
      categoryId: Joi.string().required(),
      categoryName: Joi.string().optional(),
      description: Joi.string().optional(),
    });
    try {
      const validatedBody = await fields.validateAsync(req.body);
      const { categoryId, categoryName, description } = validatedBody;
      console.log(validatedBody);

      const adminDetails = await findSeller({ _id: req.userId });
      if (!adminDetails) {
        throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
      }

      const categoryResult = await findCategory({ _id: categoryId });
      if (!categoryResult) {
        throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND);
      }
      const data = { categoryName, description };
      if (data) {
        if (data.name) {
          const iscategoryName = await findCategory({
            categoryName: data.name,
          });
          if (iscategoryName) {
            throw apiError.conflict(responseMessages.CATEGORY_ALREADY_EXISTS);
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

  /**
   * @swagger
   * /api/v1/category/deleteCategory/{categoryId}:
   *   delete:
   *     summary: admin delete category
   *     tags:
   *       - CATEGORY
   *     description: admin can delete the category.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authorization
   *         description: authorization
   *         in: header
   *         required: true
   *       - name: categoryId
   *         description: categoryId
   *         in: path
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */

  async deleteCategory(req, res, next) {
    const fields = Joi.object({
      categoryId: Joi.string().required(),
    });
    try {
      const validatedBody = await fields.validateAsync(req.params);
      const { categoryId } = validatedBody;
      console.log(validatedBody);

      const adminDetails = await findSeller({ _id: req.userId });
      if (!adminDetails) {
        throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
      }

      const categoryResult = await findCategory({ _id: categoryId });
      if (!categoryResult) {
        throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND);
      }
      const result = await deleteCategory({ _id: categoryId });
      if (!result) {
        throw apiError.badRequest(responseMessages.CATEGORY_NOT_DELETE);
      }
      return res.json(
        new successResponse(result, responseMessages.CATEGORY_DELETE)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/category/getAllCategory:
   *   get:
   *     summary: admin delete category
   *     tags:
   *       - CATEGORY
   *     description: admin fetch all category.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authorization
   *         description: authorization
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */

  async getAllCategory(req, res, next) {
    try {
      // const adminDetails = await findSeller({ _id: req.userId });

      // if (!adminDetails) {
      //   throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
      // }

      const categoryResult = await findAllCategory();

      if (!categoryResult || categoryResult.length==0) {
        throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND);
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
