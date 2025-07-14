import productServices from "../../../v1/services/product.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";
import userServices from "../../services/user.js";
import seller from "../../../../models/seller.js";
import { conditionType } from "../../../../enums/conditionType.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs/promises";
const {
  findSeller,
  findSellerOrAdmin,
  createProduct,
  updateProduct,
  checkProduct,
  findUserById,
  checkCategory,
  deleteProduct,
  findProductsOfSeller,
  findSellerById,
  findSellerByBuyerid,
  findAdmin,
  getFilteredProducts,
  getProductsByCategoryAndBrand,
  findSellerByBuyerId
} = productServices;

class ProductController {
  async createProduct(req, res, next) {
    const fields = Joi.object({
      name: Joi.string().min(3).max(100).required(),
      description: Joi.string().optional(),
      brandName: Joi.string().required(),
      termsOfPurchase: Joi.string().optional(),
      faq: Joi.string().optional(),
      conditionType: Joi.string()
        .valid(...Object.values(conditionType))
        .required(),
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
        brandName,
        termsOfPurchase,
        faq,
        conditionType,
        minBid,
        quantity,
        startTime,
        endTime,
      } = value;
      const user = await findUserById(req.userId);
      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND)
      }
      if (![userType.ADMIN, userType.BUYER].includes(user.userType)) {
        throw apiError.forbidden(responseMessages.UNAUTHORIZED)
      }
      if (user.userType === userType.BUYER) {
        const sellerDetails = await findSellerByBuyerId(req.userId);
        if (!sellerDetails) {
          throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
        }
        if (sellerDetails.statusOfApproval !== statusOfApproval.ACCEPTED) {
          throw apiError.forbidden(responseMessages.NOT_ALLOWED_TO_CREATE_PRODUCT)

        }
      }
      const category = await checkCategory(categoryId);
      if (!category) {
        throw apiError.badRequest(responseMessages.CATEGORY_NOT_FOUND)
      }
      let productImages = [];
      if (req.files && req.files.productImage) {
        productImages = req.files.productImage.map(
          (file) => `/${file.filename}`
        );
      }
      const sellerId = req.userId;
      const productData = {
        productImage: productImages,
        sellerId,
        user,
        name,
        description,
        brandName,
        termsOfPurchase,
        faq,
        conditionType,
        categoryId,
        minBid,
        quantity,
        startTime,
        endTime,
      };
      const createdProduct = await createProduct(productData);

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
      brandName: Joi.string().optional(),
      termsOfPurchase: Joi.string().optional(),
      faq: Joi.string().optional(),
      conditionType: Joi.string()
        .valid(...Object.values(conditionType))
        .optional(),
      categoryId: Joi.string().hex().length(24).optional(),
      minBid: Joi.number().min(0).optional(),
      quantity: Joi.number().integer().min(1).optional(),
      startTime: Joi.date().iso().optional(),
      endTime: Joi.date().iso().optional(),
      isSold: Joi.boolean().optional()
    });

    try {
      const { error, value } = fields.validate(req.body);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }
      const isAdmin = await findAdmin(req.userId);
      if (!isAdmin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND)
      }
      const productId = req.params.productId;
      const isProduct = await checkProduct(productId);
      if (!isProduct) {
        throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND)
      }
      const currentTime = new Date();
      if (currentTime >= isProduct.startTime || isProduct.isSold) {
        throw apiError.badRequest(responseMessages.BID_OVER_OR_SOLD_OR_STARTED)
      }

      if (value.categoryId) {
        const category = await checkCategory(value.categoryId);
        if (!category) {
          throw apiError.badRequest(responseMessages.CATEGORY_NOT_FOUND)

        }
      }

      const user = await findUserById(req.userId);
      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND)
      }

      const sellerOrAdmin = await findSellerOrAdmin(req.userId);
      if (!sellerOrAdmin) {
        throw apiError.forbidden(responseMessages.UNAUTHORIZED)
      }
      if (
        sellerOrAdmin.userType !== userType.ADMIN &&
        isProduct.sellerId !== req.userId
      ) {
        throw apiError.forbidden(responseMessages.PRODUCT_NOT_YOURS)
      }
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      let productImages = isProduct.productImage || [];
      if (req.files && req.files.productImage) {
        // Delete old images
        const deletionErrors = [];
        for (const imagePath of productImages) {
          const fullPath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "..",
            "public",
            imagePath
          );
          try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
            console.log(`Deleted image file: ${fullPath}`);
          } catch (err) {
            if (err.code === "ENOENT") {
              console.warn(`Image file not found: ${fullPath}`);
            } else {
              console.error(`Failed to delete image file: ${fullPath}`, err);
              deletionErrors.push(`Failed to delete image: ${imagePath}`);
            }
          }
        }
        if (deletionErrors.length > 0) {
          console.warn("Some images could not be deleted:", deletionErrors);
        }
        productImages = req.files.productImage.map(
          (file) => `/${file.filename}`
        );
      }

      if (req.files && req.files.productImage)
        value.productImage = productImages;

      const updatedProduct = await updateProduct(productId, value);
      return res.json(
        new successResponse(updatedProduct, responseMessages.PRODUCT_UPDATED)
      );
    } catch (error) {
      console.log("Error updating product:", error);
      return next(error);
    }
  }
  async deleteProduct(req, res, next) {
    const fields = Joi.object({
      productId: Joi.string().hex().length(24).optional(),
    });

    try {
      const { error, value } = fields.validate(req.params);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }
      const isAdmin = await findAdmin(req.userId);
      if (!isAdmin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND)
      }
      const isProduct = await checkProduct(value.productId);
      if (!isProduct) {
        throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND)
      }
      const currentTime = new Date();
      if (currentTime >= isProduct.startTime || isProduct.isSold) {
        //cant not dele`te the product after the bidding is over as it will cause problem after some times.`
        throw apiError.badRequest(
          responseMessages.PRODUCT_CANT_DELETED_WHILE_BIDDING
        )


      }
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      if (isProduct.productImage && isProduct.productImage.length > 0) {
        const deletionErrors = [];
        for (const imagePath of isProduct.productImage) {
          const fullPath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "..",
            "public",
            imagePath
          );
          try {
            await fs.unlink(fullPath);
            console.log(`Deleted image file: ${fullPath}`);
          } catch (err) {
            console.error(`Failed to delete image file: ${fullPath}`, err);
            deletionErrors.push(`Failed to delete image: ${imagePath}`);
          }
        }
        if (deletionErrors.length > 0) {
          console.warn("Some images could not be deleted:", deletionErrors);
          // Optionally, you can decide to throw an error or continue
        }
      }
      const deletedProduct = await deleteProduct(value.productId);
      return res.json(
        new successResponse(deletedProduct, responseMessages.PRODUCT_DELETED)
      );
    } catch (error) {
      console.log("Error updating product:", error);
      return next(error);
    }
  }
  async getAllProductOfSeller(req, res, next) {
    const fields = Joi.object({
      buyerId: Joi.string().hex().length(24).optional(),
    });
    try {
      const { error, value } = fields.validate(req.params);

      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }
      const user = await findSellerOrAdmin(value.buyerId);
      if (!user) {
        throw apiError.notFound(responseMessages.SELLER_NOT_FOUND)

      }
      if (![userType.ADMIN, userType.BUYER].includes(user.userType)) {
        throw apiError.forbidden(responseMessages.UNAUTHORIZED)
      }
      if (user.userType === userType.SELLER) {
        const sellerDetails = await findSeller(value.buyerId);
        if (!sellerDetails) {
          throw apiError.notFound(responseMessages.SELLER_NOT_FOUND)
        }
        if (sellerDetails.statusOfApproval !== statusOfApproval.ACCEPTED) {
          throw apiError.forbidden(responseMessages.NOT_FOUND)
        }
      }
      const products = await findProductsOfSeller(value.buyerId);
      return res.json(new successResponse(products, responseMessages.SUCCESS));
    } catch (error) {
      console.log("Error updating product:", error);
      return next(error);
    }
  }

  async getProducts(req, res, next) {
    const fields = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string()
        .valid(
          "recentlyStarted",
          "soonestToEnd",
          "priceLowToHigh",
          "priceHighToLow"
        )
        .default("recentlyStarted"),
      search: Joi.string().max(100).optional().allow(""),
      categoryId: Joi.string().hex().length(24).optional(),
    });

    try {
      const { error, value } = fields.validate(req.query);
      if (error) {
        console.error(error.details);
        return res.status(400).json({ responseMessages: error.message });
      }

      // const user = await findUserById(req.userId);
      // if (!user) {
      //   return res.json(apiError.notFound(responseMessages.USER_NOT_FOUND));
      // }

      if (value.categoryId) {
        const category = await checkCategory(value.categoryId);
        if (!category) {
          throw apiError.badRequest(responseMessages.CATEGORY_NOT_FOUND)

        }
      }

      const result = await getFilteredProducts(value);

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
          responseMessages.PRODUCTS_FETCHED
        )
      );
    } catch (error) {
      console.log("Error fetching products:", error);
      return next(error);
    }
  }

  async getProductsByCategoryAndBrand(req, res, next) {
    const fields = Joi.object({
      categoryId: Joi.string().hex().length(24).required(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    try {
      const { error, value } = fields.validate(req.query);
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }

      // const user = await findUserById(req.userId);
      // if (!user) {
      //   return res.json(new apiError.notFound(responseMessages.USER_NOT_FOUND));
      // }

      const category = await checkCategory(value.categoryId);
      if (!category) {
        throw apiError.badRequest(responseMessages.CATEGORY_NOT_FOUND)
      }

      const result = await getProductsByCategoryAndBrand(value);

      return res.json(
        new successResponse({
          products: result.products,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        }, responseMessages.PRODUCTS_BY_CATEGORY_AND_BRAND_FETCHED)
      );
    } catch (error) {
      console.log("Error fetching products by category and brand:", error);
      return next(
        error
      );
    }

  }

  async getSellerProductBids(req, res, next) {
    const fields = Joi.object({
      productId: Joi.string().hex().length(24).required(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    try {
      const { error, value } = fields.validate({ ...req.body, ...req.query });
      if (error) {
        console.error(error.details);
        return res.json({ error: error.message });
      }

      const { productId, page, limit } = value;

      // Verify requesting user
      const user = await findUserById(req.userId);
      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND)
      }

      const result = await bidServices.getSellerProductBids(productId, req.userId, { page, limit });

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
          responseMessages.SELLER_BIDS_FETCHED
        )
      );
    } catch (error) {
      console.log("Error fetching seller bids:", error);
      return next(
        error
      );
    }
  }

}
export default new ProductController();
