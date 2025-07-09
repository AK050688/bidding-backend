import userServices from "../../../v1/services/user.js";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import Joi from "joi";
import commonFunction from "../../../../helper/utils.js";
import bcrypt from "bcrypt";
import successResponse from "../../../../../assets/response.js";
import { status } from "../../../../enums/status.js";
import { userType } from "../../../../enums/userType.js";
import config from "config";
import cron from "node-cron";
const {
  checkUserExists,
  createUser,
  findUser,
  findUserV2,
  updateUserById,
  findAll,
  findUserById,
  updateUser,
} = userServices;

export class userController {
  async userSignup(req, res, next) {
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(30).required(),
      lastName: Joi.string().min(3).max(10).required(),
      email: Joi.string().required(),
      password: Joi.string().required(),
      mobileNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .required(),
      addressLine: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      dateOfBirth: Joi.string().required(),
      countryCode: Joi.string().required(),
    });
    try {
      const validatedBody = await schema.validateAsync(req.body);
      const {
        firstName,
        lastName,
        email,
        password,
        mobileNumber,
        addressLine,
        city,
        state,
        zipCode,
        countryCode,
        dateOfBirth,
      } = validatedBody;

      validatedBody.password = bcrypt.hashSync(validatedBody.password, 10);

      const user = await checkUserExists(email, mobileNumber);

      if (user) {
        if (user.status === "BLOCKED") {
          throw apiError.forbidden(responseMessages.UNAUTHORIZED)
        } else if (user.mobileNumber === mobileNumber) {
          throw apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST)
        } else if (user.email === email) {
          throw apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST)
        } else {
          throw apiError.conflict(responseMessages.USER_ALREADY_EXIST)

        }
      }
      // await commonFunction.sendMail(email, validatedBody.otp);
      const result = await createUser(validatedBody);
      return res.json(
        new successResponse(result, responseMessages.USER_CREATED)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async forgotPassword(req, res, next) {
    const schema = Joi.object({
      email: Joi.string().required(),
    });
    try {
      const validatedBody = await schema.validateAsync(req.body);
      const { email } = validatedBody;

      const user = await findUser(email);

      if (!user) {
        return res.json(apiError.notFound(responseMessages.USER_NOT_FOUND));
      }
      if (user.status === status.BLOCK || user.status === status.DELETE) {
        return res.json(apiError.forbidden(responseMessages.UNAUTHORIZED));
      }

      const otp = commonFunction.getOTP();
      const otpExpireTime = Date.now() + 180000;

      const subject = "Your Password Reset OTP";
      const html = commonFunction.getOTPEmailTemplate(otp);
      await commonFunction.sendMail(email, subject, html);
      await updateUser(
        { email: email },
        {
          $set: {
            otp: otp,
            otpExpireTime: otpExpireTime,
            isVerified: false,
          },
        },
        { new: true }
      );

      return res.json(new successResponse(responseMessages.OTP_SEND));
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async otpVerification(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
      otp: Joi.string().required(),
    });

    try {
      const validate = await fields.validateAsync(req.body);
      const { email, otp } = validate;
      const userResult = await findUser(email);

      if (!userResult) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      } else {
        // if (userResult.isVerified == true) {
        //   throw apiError.conflict(responseMessages.OTP_ALREADY_VERIFIED);
        // }
        if (userResult.otpExpireTime < Date.now()) {
          throw apiError.badRequest(responseMessages.OTP_EXPIRED);
        }
        if (userResult.otp != otp) {
          throw apiError.badRequest(responseMessages.INCORRECT_OTP);
        }
        const updateOtp = await updateUserById(
          { _id: userResult._id },
          { $set: { isVerified: true, otp: "" } }
        );

        return res.json(
          new successResponse(updateOtp, responseMessages.OTP_VERIFY)
        );
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async resendOtp(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      const userResult = await findUser(validate.email);
      console.log(userResult);
      if (!userResult) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      } else {
        if (userResult.isVerified == true) {
          throw apiError.conflict(responseMessages.OTP_ALREADY_VERIFIED);
        }

        const otp = commonFunction.getOTP();
        const otpExpireTime = Date.now() + 180000;

        const subject = "Your Password Reset OTP";
        const html = commonFunction.getOTPEmailTemplate(otp);
        await commonFunction.sendMail(validate.email, subject, html);
        await updateUserById(
          { _id: userResult._id },
          { $set: { otp: otp, otpExpireTime: otpExpireTime } }
        );

        return res.json(new successResponse(responseMessages.OTP_RESEND));
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async passwordChange(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
      confirmNewPassword: Joi.string().required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      const userResult = await findUser(validate.email);
      console.log(userResult);
      if (!userResult) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      }

      if (validate.password !== validate.confirmNewPassword) {
        throw apiError.badRequest(
          responseMessages.CONFIRM_PASSWORD_NOT_MATCHED
        );
      }
      validate.password = bcrypt.hashSync(validate.password, 10);

      await updateUser(
        { email: validate.email },
        {
          $set: {
            password: validate.password,
          },
        },
        { new: true }
      );
      return res.json(new successResponse(responseMessages.PASSWORD_CHANGED));
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async userLogin(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      const userResult = await findUser(validate.email);
      if (!userResult) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      }

      const compare = bcrypt.compareSync(
        validate.password,
        userResult.password
      );
      if (compare == false) {
        throw apiError.invalid(responseMessages.INVALID_PASSWORD);
      }
      const token = await commonFunction.getToken({ _id: userResult._id });
      const sendResult = {
        _id: userResult._id,
        firstName: userResult.firstName,
        lastName: userResult.lastName,
        userType: userResult.userType,
        email: userResult.email,
        mobileNumber: userResult.mobileNumber,
        addressLine: userResult.addressLine,
        token: token,
      };
      return res.json(
        new successResponse(sendResult, responseMessages.LOGIN_SUCCESS)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userDetail = await findUserById({ _id: req.userId });
      if (!userDetail) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      return res.json(
        new successResponse(userDetail, responseMessages.USER_DETAILS)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async userEditProfile(req, res, next) {
    // Joi validation schema
    const schema = Joi.object({
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string()
        .pattern(/^\d{10}$/)
        .optional(), // Example: 10-digit number
      password: Joi.string().min(6).optional(),
      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .when("password", {
          is: Joi.exist(),
          then: Joi.required(),
        }),
      firstName: Joi.string().min(1).optional(),
      lastName: Joi.string().min(1).optional(),
      dateOfBirth: Joi.date().iso().optional(), // ISO date, e.g., "1990-01-01"
      addressLine: Joi.string().optional(),
      countryCode: Joi.string()
        .pattern(/^\+\d{1,3}$/)
        .optional(), // e.g., "+91"
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string()
        .pattern(/^\d{5,6}$/)
        .optional(), // Example: 5-6 digit zip
    }).min(1); // At least one field required

    try {
      // Validate input
      const validated = await schema.validateAsync(req.body, {
        abortEarly: false,
      });
      const {
        email,
        mobileNumber,
        password,
        confirmPassword,
        firstName,
        lastName,
        dateOfBirth,
        addressLine,
        countryCode,
        city,
        state,
        zipCode,
      } = validated;

      // Find user
      const userDetail = await findUserById(req.userId);
      if (!userDetail) {
        throw apiError.notFound(
          responseMessages.USER_NOT_FOUND || "User not found"
        );
      }

      // Check for email/mobileNumber conflicts
      if (email || mobileNumber) {
        const conflict = await checkUserExists(
          email || userDetail.email,
          mobileNumber || userDetail.mobileNumber
        );
        if (conflict && conflict._id.toString() !== userDetail._id.toString()) {
          if (conflict.email === email) {
            throw apiError.conflict(
              responseMessages.EMAIL_ALREADY_EXIST || "Email already exists"
            );
          }
          if (conflict.mobileNumber === mobileNumber) {
            throw apiError.conflict(
              responseMessages.MOBILE_ALREADY_EXIST ||
              "Mobile number already exists"
            );
          }
        }
      }

      // Prepare update object
      const updateObj = {};
      if (email) updateObj.email = email;
      if (mobileNumber) updateObj.mobileNumber = mobileNumber;
      if (firstName) updateObj.firstName = firstName;
      if (lastName) updateObj.lastName = lastName;
      if (dateOfBirth) updateObj.dateOfBirth = dateOfBirth;
      if (addressLine) updateObj.addressLine = addressLine;
      if (countryCode) updateObj.countryCode = countryCode;
      if (city) updateObj.city = city;
      if (state) updateObj.state = state;
      if (zipCode) updateObj.zipCode = zipCode;
      if (password) {
        updateObj.password = bcrypt.hashSync(password, 10);
      }

      // Update user
      const updatedUser = await updateUserById(
        { _id: userDetail._id },
        { $set: updateObj }
      );
      if (!updatedUser) {
        throw apiError.internal(
          responseMessages.ERROR_UPDATING_USER || "Error updating profile"
        );
      }

      const responseData = {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName || null,
        email: updatedUser.email || null,
        mobileNumber: updatedUser.mobileNumber || null,
        addressLine: updatedUser.addressLine || null,
        countryCode: updatedUser.countryCode || null,
        city: updatedUser.city || null,
        state: updatedUser.state || null,
        zipCode: updatedUser.zipCode || null,
        dateOfBirth: updatedUser.dateOfBirth || null,
        userType: updatedUser.userType,
        status: updatedUser.status,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      return res.json(
        new successResponse(
          responseData,
          responseMessages.SUCCESS || "Profile updated successfully"
        )
      );
    } catch (error) {
      console.error("Error in userEditProfile:", error);
      return next(error);
    }
  }

  async reSetPassword(req, res, next) {
    const schema = Joi.object({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
      confirmNewPassword: Joi.string().required(),
    });
    try {
      const validatedBody = await schema.validateAsync(req.body);
      const { oldPassword, newPassword, confirmNewPassword } = validatedBody;

      const user = await findUserById({ _id: req.userId });
      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      const compare = await bcrypt.compare(oldPassword, user.password);
      if (compare == false) {
        throw apiError.badRequest(responseMessages.INVALID_OLD_PASSWORD);
      } else if (newPassword != confirmNewPassword) {
        throw apiError.badRequest(
          responseMessages.CONFIRM_PASSWORD_NOT_MATCHED
        );
      } else {
        const updatPassword = bcrypt.hashSync(confirmNewPassword, 10);
        await updateUserById(
          { _id: user._id },
          { $set: { password: updatPassword } }
        );
        return res.json(new successResponse(responseMessages.PASSWORD_CHANGED));
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }
}
export default new userController();
