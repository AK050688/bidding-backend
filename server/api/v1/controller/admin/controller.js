import successResponse from "../../../../../assets/response.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import { status } from "../../../../enums/status.js";
import { statusOfApproval } from "../../../../enums/statusOfApproval.js";
import transactionServices from "../../services/transaction.js";
import { userType } from "../../../../enums/userType.js";
import apiError from "../../../../helper/apiError.js";
import commonFunction from "../../../../helper/utils.js";
import userServices from "../../services/user.js";
import sellerServices from "../../services/sellers.js";
import bidService from "../../services/bid.js";
import lotServices from "../../services/lot.js";
// import productService from "../../services/product.js";
import bcrypt from "bcrypt";
import Joi from "joi";
import { lotStatus } from "../../../../enums/lotStatus.js";
const { updateUserById, findAdmin, paginate, findUserById, findAdminv2, countUser, findAll, findAllBuyers } = userServices;
const { findSellerById, updateSellerById, findAllRequest, findSellerByBuyerid, countSeller, findSellerDoc, findAllSeller } = sellerServices;
// const { allProductDocuments, findIsSoldProduct, } = productService;
const { getLiveBidCounts,BidCount } = bidService;
const { findSoldLots, findAllLotDocuments,findById ,updateLotById,findlot} = lotServices;
const { findTransaction, findAndUpdate, findTransactionByOrderId } = transactionServices;

class adminController {
  async adminLogin(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      let query = {
        $and: [{ userType: userType.ADMIN }, { email: validate.email }],
      };
      const adminDetails = await findAdmin(query);
      if (!adminDetails) {
        throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
      }
      const comparePassword = bcrypt.compareSync(
        validate.password,
        adminDetails.password
      );
      if (comparePassword == false) {
        throw apiError.invalid(responseMessages.INVALID_PASSWORD);
      } else {
        const token = await commonFunction.getToken({ _id: adminDetails._id });
        const sendResult = {
          _id: adminDetails._id,
          firstName: adminDetails.firstName,
          lastName: adminDetails.lastName,
          userType: adminDetails.userType,
          email: adminDetails.email,
          mobileNumber: adminDetails.mobileNumber,
          addressLine: adminDetails.addressLine,
          token: token,
        };
        return res.json(
          new successResponse(sendResult, responseMessages.LOGIN_SUCCESS)
        );
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async adminResetPassword(req, res, next) {
    try {
      const requiredFields = [
        "oldPassword",
        "newPassword",
        "confirmNewPassword",
      ];
      const missingFields = [];
      const body = req.body;
      requiredFields.forEach((field) => {
        if (!body[field]) {
          missingFields.push(field);
        }
      });
      if (missingFields.length > 0) {
        const err = missingFields.map((fields) => `${fields} is required`);
        return res.json({ responseMessages: err });
      } else {
        const admin = await findAdmin({
          $and: [{ _id: req.userId }, { userType: userType.ADMIN }],
        });

        if (!admin) {
          throw apiError.notFound(responseMessages.USER_NOT_FOUND);
        }
        const compare = await bcrypt.compare(body.oldPassword, admin.password);
        if (compare == false) {
          throw apiError.badRequest(responseMessages.INVALID_OLD_PASSWORD);
        } else if (body.newPassword != body.confirmNewPassword) {
          throw apiError.badRequest(
            responseMessages.CONFIRM_PASSWORD_NOT_MATCHED
          );
        } else {
          const updatPassword = bcrypt.hashSync(body.confirmNewPassword, 10);
          await updateUserById(
            { _id: admin._id },
            { $set: { password: updatPassword } }
          );
          return res.json(
            new successResponse(responseMessages.PASSWORD_CHANGED)
          );
        }
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async paginateAlluserList(req, res, next) {
    try {
      const { page, limit } = req.query;
      if (page < 1) {
        throw apiError.badRequest(responseMessages.PAGE_UNSPECIFIED);
      } else if (limit < 1) {
        throw apiError.badRequest(responseMessages.LIMIT_UNSPECIFIED);
      }
      const query = { userType: userType.USER };
      const paginateResult = await paginate(query, page, limit);
      if (!paginateResult) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      }
      return res.json(
        new successResponse(paginateResult, responseMessages.SUCCESS)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  // async dashboard(req, res, next) {
  //   try {
  //     const admin = await findAdmin(req.userId)
  //     if (!admin) {
  //       throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND)
  //     }
  //     const results = await dashboard();

  //     if (!dashboard) {
  //       throw apiError.badRequest(responseMessages.UNABLE_TO_GET_DASHBOARD)
  //     }

  //     return res.json(new successResponse(results, responseMessages.SUCCESS))
  //   } catch (error) {
  //     console.log("error..", error);
  //     return next(error)
  //   }

  // }

  async markUserStatus(req, res, next) {
    const fields = Joi.object({
      userStatus: Joi.string().valid('ACTIVE', 'BLOCKED', 'DELETE'),
      userId: Joi.string().required()
    })
    try {
      const validate = await fields.validateAsync(req.body);

      const { userStatus, userId } = validate
      const isAdmin = await findAdmin(req.userid);
      if (!isAdmin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
      }
      const updateUser = await updateUserById({ _id: userId }, { status: userStatus })
      if (!updateUser) {
        throw apiError.badRequest(responseMessages.USER_STATUS_NOT_UPDATED)

      }
      return res.json(new successResponse(responseMessages.USER_STATUS_UPDATED))


    } catch (error) {
      console.log("error..", error);
      return next()

    }
  }

  // async markOrderStatus(req, res, next) {
  //   const fields = Joi.object({
  //     orderStatus: Joi.string().valid('ACTIVE', 'BLOCKED', 'DELETE'),
  //     transactionId: Joi.string().required()
  //   })
  //   try {
  //     const validate = await fields.validateAsync(req.body);



  //     const { userStatus, userId } = validate
  //     const isAdmin = await findAdmin(req.userid);
  //     if (!isAdmin) {
  //       throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
  //     }
  //     const updateUser = await updateUserById({ _id: userId }, { status: userStatus })
  //     if (!updateUser) {
  //       throw apiError.badRequest(responseMessages.USER_STATUS_NOT_UPDATED)

  //     }
  //     return res.json(new successResponse(responseMessages.USER_STATUS_UPDATED))


  //   } catch (error) {
  //     console.log("error..", error);
  //     return next(error)

  //   }
  // }

  async requestApproval(req, res, next) {
    const fields = Joi.object({
      buyerId: Joi.string().required()
        .required(),
      status: Joi.string()
        .valid(...Object.values(statusOfApproval))
        .required(),
    })

    try {
      const validate = await fields.validateAsync(req.body);

      const { buyerId, status } = validate
      const isAdmin = await findAdminv2(req.userId);
      if (!isAdmin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);

      }
      const buyer = await findUserById(buyerId)
      if (!buyer) {
        return res.json(apiError.notFound(responseMessages.USER_NOT_FOUND))
      }
      const isSeller = await findSellerByBuyerid(buyerId)
      if (!isSeller) {
        return res.json(
          apiError.badRequest(responseMessages.USER_NOT_FOUND)
        );
      }
      const sellerId = isSeller._id;

      const updateStatus = await updateSellerById(sellerId, { $set: { statusOfApproval: status } })
      await updateUserById(buyerId, { $set: { isSeller: true } })

      return res.json(new successResponse(updateStatus, responseMessages.USER_STATUS_UPDATED))
    } catch (error) {
      console.log("error..", error);
      return next(error)

    }
  }
  async getAllRequest(req, res, next) {

    const fields = Joi.object({
      statusOfApproval: Joi.string()
        .valid(...Object.values(statusOfApproval))
        .required(),
    })

    try {
      const validate = await fields.validateAsync(req.body);
      const { statusOfApproval } = validate
      const isAdmin = await findAdminv2(req.userId);
      if (!isAdmin) {
        return res.json(
          apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND)
        );
      }
      const updateStatus = await findAllRequest({ statusOfApproval: statusOfApproval })
      return res.json(new successResponse(updateStatus, responseMessages.SUCCESS))
    } catch (error) {
      console.log("error..", error);
      return next(error)

    }
  }
  async getSpecificRequest(req, res, next) {
    const fields = Joi.object({
      buyerId: Joi.string().required(),
    })
    try {
      const validate = await fields.validateAsync(req.params);
      const { buyerId } = validate
      const isAdmin = await findAdminv2(req.userId);
      if (!isAdmin) {
        return res.json(
          apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND)
        );
      }
      const updateStatus = await findSellerById(buyerId)
      return res.json(new successResponse(updateStatus, responseMessages.SUCCESS))
    } catch (error) {
      console.log("error..", error);
      return next(error)

    }
  }
  async userCountData(req, res, next) {
    try {
      const isAdmin = await findAdmin(req.userId);
      console.log(isAdmin);

      if (!isAdmin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
      }
      const totalBuyer = await countUser({ userType: userType.BUYER });
      const totalSeller = await countSeller({ userType: userType.SELLER });
      return res.json(new successResponse({ totalBuyer, totalSeller }, responseMessages.DATA_FOUND));
    } catch (error) {
      console.log("error in userCountData:", error);
      return next(error);

    }
  }

  async adminDeleteUser(req, res, next) {
    const schema = Joi.object({
      userId: Joi.string().required()
    });

    try {
      const { userId } = await schema.validateAsync(req.body);

      const isAdmin = await findAdminv2(req.userId);
      if (!isAdmin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
      }

      const user = await findUserById(userId);
      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }

      await deleteUserById(userId);

      return res.json(
        new successResponse({}, responseMessages.USER_DELETED_SUCCESSFULLY)
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      return next(error);
    }
  }
  async markSellerStatus(req, res, next) {
    const schema = Joi.object({
      sellerId: Joi.string().required(),
      sellerStatus: Joi.string().valid("ACTIVE", "BLOCKED", "DELETED").required()
    });

    try {
      const { sellerId, sellerStatus } = await schema.validateAsync(req.body);

      const isAdmin = await findAdmin(req.userId);
      if (!isAdmin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
      }

      const seller = await findSellerById(sellerId);
      if (!seller) {
        throw apiError.notFound(responseMessages.SELLER_NOT_FOUND);
      }

      const updatedSeller = await updateSellerById(
        sellerId,
        { $set: { status: sellerStatus } }
      );

      return res.json(
        new successResponse(updatedSeller, responseMessages.USER_STATUS_UPDATED)
      );
    } catch (error) {
      console.error("markSellerStatus error:", error);
      return next(error);
    }
  }
  async Dashboard(req, res, next) {
    try {
      const admin = await findUserById(req.userId, userType.ADMIN);
      if (!admin) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      const totalLot = await findAllLotDocuments();
      const isSoldLot = await findSoldLots({ isSold: true });
      const totalBuyer = await findAll({ userType: userType.BUYER });
      const totalSellers = await findSellerDoc();
      const totalLiveBids = await getLiveBidCounts();


      return res.json(
        new successResponse(
          {
            totalLot: totalLot,
            isSoldLot: isSoldLot,
            totalBuyers: totalBuyer,
            totalSellers: totalSellers,
            totalLiveBids: totalLiveBids,
          },
          responseMessages.DATA_FOUND
        )
      );
    } catch (error) {
      console.error("Error in Daseboard:", error);
      return next(error);
    }
  }
  async getAllBuyers(req, res, next) {
    try {
      const admin = await findAdmin(req.userId);
      if (!admin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
      }
      const buyers = await findAllBuyers({ userType: "BUYER" });
      return res.json(
        new successResponse(buyers, responseMessages.BUYERS_FETCHED)
      );
    } catch (error) {
      console.log("Error in getAllBuyers:", error);
      return next(error);
    }
  }
  async getAllSeller(req, res, next) {
    try {
      const admin = await findAdmin(req.userId);
      if (!admin) {
        throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
      }
      const sellers = await findAllSeller();
      return res.json(new successResponse(sellers, responseMessages.DATA_FOUND));
    } catch (error) {
      console.log("Error in getAllSeller:", error);
      return next(error);
    }
  }
  async getAllTransactions(req, res, next) {
    try {
      if (!req.user || req.user.userType !== userType.ADMIN) {
        throw apiError.forbidden(responseMessages.ADMIN_CAN_ACCESS);
      }

      const transactions = await findTransaction();

      return res.status(200).json(
        new successResponse(transactions, responseMessages.TRANSACTION_FOUND)
      );
    } catch (error) {
      console.error("getAllTransactions Error:", error);
      return next(error);
    }
  }

  async getTransactionByOrderId(req, res, next) {
    const schema = Joi.object({
      orderId: Joi.string().required(),
    });

    try {
      const { error, value } = schema.validate(req.params);
      if (error) throw apiError.badRequest(error.details[0].message);

      const { orderId } = value;

      const transaction = await findTransactionByOrderId(orderId);
      if (!transaction) {
        throw apiError.notFound(responseMessages.TRANSACTION_NOT_FOUND_FOR_ORDER_ID);
      }

      return res.status(200).json(
        new successResponse(transaction, responseMessages.TRANSACTION_FOUND)
      );
    } catch (error) {
      console.error("getTransactionByOrderId Error:", error);
      return next(error);
    }
  }
  async lotAcceptByAdminRequest(req, res, next){
  const schema = Joi.object({
    lotId: Joi.string().hex().length(24).required(),
    status:Joi.string().valid("ACCEPTED","REJECTED").required()
  });

  try {
    const { error, value } = schema.validate(req.body); 
    if (error) {
      throw apiError.badRequest(error.details[0].message);
    }

    const { lotId } = value;
    const isAdmin = await findAdmin(req.userid);
    if (!isAdmin) {
      throw apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND);
    }
    const lot = await findById(lotId);
    if (!lot) {
      throw apiError.notFound(responseMessages.LOT_NOT_FOUND);
    }
    if (lot.lotStatus === "ACCEPTED") {
      throw apiError.badRequest(responseMessages.LOT_ACCEPT);
    }
    if (lot.lotStatus === "REJECTED") {
      throw apiError.badRequest(responseMessages.LOT_REJECT);
    }
    await updateLotById(lotId, {
      lotStatus: "ACCEPTED",
      approvedBy: req.userid,
      approvedAt: new Date(),
    });

    return res.json(
      new successResponse(
        { lotId },
        responseMessages.LOT_ACCEPT_BY_ADMIN  
      )
    );

  } catch (error) {
    console.error("Error in lotAcceptByAdminRequest:", error);
    next(error);
  }
}
async getAllLotOnBid(req, res, next){
  try {
    const isAdmin = await findAdmin(req.userid); 
    if (!isAdmin) {
      throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
    }
    const lots = await findlot();
    const stats = await Promise.all(
      lots.map(async (lot) => {
        const bidCount = await BidCount({ lotId: lot._id });
        return {
          lotId: lot._id,
          productName: lot.productName,
          sellerId: lot.sellerId,
          floorPrice: lot.floorPrice,
          totalBids: bidCount
        };
      })
    );

    return res.status(200).json({ lots: stats });
  } catch (error) {
    console.error("Error in getAllLotBidStats:", error);
    next(error);
    
  }
};













}
export default new adminController();
