import productServices from "../../../v1/services/product.js";
import mongoose from "mongoose";
import bidServices from "../../../v1/services/bid.js"
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
import { statusOfApproval } from "../../../../enums/statusOfApproval.js";
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
  findSellerByBuyerId,
  getHighestBidForProduct
} = productServices;
const { getSellerProductBids, findPtoductaggration } = bidServices

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
      console.log(user), ">>>>>>>>>>>>>>>>>>>>>>>>>>";

      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND)
      }
      if (![userType.ADMIN, userType.BUYER].includes(user.userType)) {
        throw apiError.forbidden(responseMessages.UNAUTHORIZED)
      }
      if (user.userType === userType.BUYER) {
        const sellerDetails = await findSellerByBuyerId(req.userId);
        console.log(sellerDetails, "=====================");

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
      console.log(isProduct, "===================================>");

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

      const result = await getSellerProductBids(productId, req.userId, { page, limit });
      console.log(result, "<<<<<<<<<<<<<<<<<<");

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
  async getBidCategoriesByBuyer(req, res, next) {
    try {
      const { buyerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(buyerId)) {
        throw apiError.badRequest(responseMessages.INVALID_USER);
      }

      const categories = await findPtoductaggration(buyerId)

      return res.json(new successResponse(categories, "Categories bid on by buyer"));
    } catch (error) {
      console.log("Error:", error);
      return next(error);
    }
  }
  // async chooseWinner(req, res, next) {
  //   const schema = Joi.object({
  //     productId: Joi.string().hex().length(24).required(),
  //   });
  //   try {
  //     const { error, value } = schema.validate(req.params);
  //     if (error) {
  //       return res.status(400).json({ error: error.message });
  //     }
  //     const { productId } = value;
  //     const user = await findUserById(req.userId);


  //     if (!user) {
  //       throw apiError.notFound(responseMessages.USER_NOT_FOUND);
  //     }
  //     const product = await checkProduct(productId);


  //     if (!product) {
  //       throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND);
  //     }

  //     if (product.isSold) {
  //       throw apiError.badRequest(responseMessages.PRODUCT_ALREADY_SOLD);
  //     }


  //     const isAuthorized =
  //       user.userType === userType.ADMIN ||
  //       String(product.sellerId) === String(req.userId);

  //     if (!isAuthorized) {
  //       throw apiError.forbidden(responseMessages.UNAUTHORIZED);
  //     }
  //     const topBid = await getHighestBidForProduct(productId);
  //     if (!topBid) {
  //       throw apiError.notFound("No bids placed for this product");
  //     }


  //     // Update product with winnerId and isSold: true
  //     const updatedProduct = await updateProduct(productId, {
  //       winnerId: topBid.buyerId,
  //       isSold: true,
  //     });
  //     return res.json(
  //       new successResponse(updatedProduct, "Winner selected successfully")
  //     );
  //   } catch (error) {
  //     console.log("Error choosing winner:", error);
  //     return next(error);
  //   }
  // }
  async chooseWinner(req, res, next) {
    const schema = Joi.object({
      productId: Joi.string().hex().length(24).required(),
    });

    try {
      const { error, value } = schema.validate(req.params);
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const { productId } = value;

      // Find the product
      const product = await checkProduct(productId);
      if (!product) {
        throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND);
      }

      if (product.isSold) {
        throw apiError.badRequest("Product is already sold");
      }

      const topBid = await getHighestBidForProduct(productId);
      if (!topBid) {
        throw apiError.notFound("No bids placed on this product");
      }

     
      await updateProduct(productId, {
        winnerId: topBid.buyerId,
        isSold: true,
      });

    
      return res.json(
        new successResponse(
          {
            bidId: topBid._id,
            buyerId: topBid.buyerId,
            productId: productId,
            winnerId: topBid.buyerId,
            isSold: true,
          },
          "Winner has been selected successfully"
        )
      );
    } catch (error) {
      console.log("Error choosing winner:", error);
      return next(error);
    }
  }
























}


export default new ProductController();
