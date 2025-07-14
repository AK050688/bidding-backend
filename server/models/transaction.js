import { model, Schema } from "mongoose";
import Mongoose from "mongoose"
import { paymentMethod } from "../enums/paymentMethod.js";
import { paymentStatus } from "../enums/paymentStatus.js";
Mongoose.pluralize(null);

const trnasactionSchema = new Schema({
    buyerId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    sellerId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    productId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
    },
    bidId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: "bids",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        // enum: ["card", "upi", "netbanking", "wallet", "cod"],
        enum:     [...Object.values(paymentMethod)]      ,
        required: true,
    },
    paymentStatus: {
        type: String,
        // enum: ["pending", "success", "failed"],
        enum:     [...Object.values(paymentStatus)] ,
        default: "pending",
    },
    transactionId: {
        type: String,
        unique: true,
        required: true,
    },
    isRefunded: {
        type: Boolean,
        default: false,
    },
    refundDetails: {
        refundedOn: Date,
        refundReason: String,
    },
},
{ timestamps: true }
)
export default model("transaction", trnasactionSchema);

