import successResponse from "../../../../../assets/response.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import { status } from "../../../../enums/status.js";
import { statusOfApproval } from "../../../../enums/statusOfApproval.js";
import { userType } from "../../../../enums/userType.js";
import apiError from "../../../../helper/apiError.js";
import commonFunction from "../../../../helper/utils.js";
import userServices from "../../services/user.js";
import sellerServices from "../../services/sellers.js";
import bcrypt from "bcrypt";
import Joi from "joi";
const { updateUserById, findAdmin, paginate, dashboard, findUserById, findAdminv2 } = userServices;
const { findSellerById, updateSellerById, findAllRequest } = sellerServices;
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
      sellerId: Joi.string().required()
        .required(),
      statusOfApproval: Joi.string()
        .valid(...Object.values(statusOfApproval))
        .required(),
    })

    try {
      const validate = await fields.validateAsync(req.body);
      const { sellerId, statusOfApproval } = validate
      const isAdmin = await findAdminv2(req.userId);
      if (!isAdmin) {
        return res.json(
          apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND)
        );

      }
      const isSeller = await findSellerById(sellerId)
      if (!isSeller) {
         return res.json(
          apiError.badRequest(responseMessages.USER_NOT_FOUND)
        );
      }
       const updateStatus = await updateSellerById(sellerId, { $set: { statusOfApproval: statusOfApproval } })
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
      const updateStatus = await findAllRequest({ statusOfApproval: statusOfApproval  })
      return res.json(new successResponse(updateStatus, responseMessages.SUCCESS))
    } catch (error) {
      console.log("error..", error);
      return next(error)

    }
  }
  async getSpecificRequest(req, res, next) {
    const fields = Joi.object({
      requestId: Joi.string().required(),
    })
    try {
      const validate = await fields.validateAsync(req.params);
      const { requestId } = validate
      const isAdmin = await findAdminv2(req.userId);
      if (!isAdmin) {
        return res.json(
          apiError.unauthorized(responseMessages.ADMIN_NOT_FOUND)
        );
      }
      const updateStatus = await findSellerById(requestId)
      return res.json(new successResponse(updateStatus, responseMessages.SUCCESS))
    } catch (error) {
      console.log("error..", error);
      return next(error)

    }
  }
}
export default new adminController();
