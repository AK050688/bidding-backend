import Razorpay from "razorpay";
import crypto from "crypto";
import config from "config";
import { v4 as uuidv4 } from "uuid";
import userServices from "../../services/user.js";
import sellerServices from "../../services/sellers.js";
import transactionServices from "../../services/transaction.js";
import Joi from "joi";
import apiError from "../../../../helper/apiError.js";
import responseMessages from "../../../../../assets/responseMessages.js";
import { paymentStatus } from "../../../../enums/paymentStatus.js";
import successResponse from "../../../../../assets/response.js";
const { findUserById } = userServices;
const { findByIds } = sellerServices;
const { createRequest, findTransactionByOrderId, updateTransactionByOrderId } = transactionServices;

const razorpay = new Razorpay({
  key_id: config.get("razorpay.RAZOR_PAY_KEY_ID"),
  key_secret: config.get("razorpay.RAZOR_PAY_KEY_SECRET"),
});





class transactionController {


  async createOrder(req, res, next) {
    const validateSchema = Joi.object({
      amount: Joi.number().required(),
      buyerId: Joi.string().required(),
      sellerId: Joi.string().required(),
      productId: Joi.string().required(),
      bidId: Joi.string().required(),
      paymentMethod: Joi.string().required(),
    });

    try {
      const { error, value: validatedBody } = validateSchema.validate(req.body);

      if (error) {
        console.log("Validation Error:", error.details[0].message);
        throw apiError.badRequest(error.details[0].message);
      }

      const { amount, buyerId, sellerId, productId, bidId, paymentMethod } = validatedBody;

      const buyer = await findUserById(buyerId);
      const seller = await findByIds(sellerId);
      if (!buyer || !seller) {
        throw apiError.notFound(responseMessages.BUYER_AND_SELLER_NOT_FOUND);
      }

      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
      };

      razorpay.orders.create(options, async (err, rpOrder) => {
        if (err) {
          console.log("Razorpay Error:", err);
          return next(apiError.internal("Failed to create payment order"));
        }
        const transactionPayload = {
          buyerId,
          paymentMethod,
          sellerId,
          productId,
          bidId,
          amount,
          paymentStatus: paymentStatus.CREATED,
          transactionId: rpOrder.id,
          razorpayOrderId: rpOrder.id,
        };

        const createdTransaction = await createRequest(transactionPayload);


        return res.status(200).json(
          new successResponse(
            {
              orderId: rpOrder.id,
              amount: rpOrder.amount,
              currency: rpOrder.currency,
              receipt: rpOrder.receipt,
              transaction: createdTransaction,
            },
            responseMessages.ORDER_CREATE
          )
        );
      });
    } catch (error) {
      console.log("CreateOrder Error:", error);
      return next(error);
    }
  }

  async verifyAndStoreTransaction(req, res, next) {
    const validateSchema = Joi.object({
      razorpay_order_id: Joi.string().required(),
      razorpay_payment_id: Joi.string().required(),
      razorpay_signature: Joi.string().required()
    });
    try {
      const { error, value } = validateSchema.validate(req.body);
      if (error) {
        logger.warn(`Signature verification error: ${error.details[0].message}`);
        throw apiError.badRequest(error.details[0].message);
      }
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const transaction = await findTransactionByOrderId(razorpay_order_id);
      //   console.log(transaction, "===============================>transaction");

      if (!transaction) {
        throw apiError.notFound(responseMessages.TRANSACTION_NOT_FOUND);
      }

      const generatedSignature = crypto
        .createHmac("sha256", config.get("razorpay.RAZOR_PAY_KEY_SECRET"))
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        await updateTransactionByOrderId(razorpay_order_id, {
          paymentStatus: paymentStatus.FAILED,
          transactionId: razorpay_payment_id,
        });
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment signature" });
      }

      const updatedTransaction = await updateTransactionByOrderId(
        razorpay_order_id,
        {
          paymentStatus: paymentStatus.SUCCESS,
          transactionId: razorpay_payment_id,
          completedAt: new Date()
        }
      );

      return res.status(200).json(
        new successResponse(
          updatedTransaction,
          "Payment verified and transaction updated"
        )
      );
    } catch (error) {
      console.log("verifyAndStoreTransaction Error:", error);
      return next(error);
    }
  }















































}
export default new transactionController();
