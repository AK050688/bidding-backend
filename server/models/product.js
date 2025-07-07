import { model, Schema } from "mongoose";
import mongoose from "mongoose"
import { statusOfApproval } from "../enums/statusOfApproval.js";
import { conditionType } from "../enums/conditionType.js";

mongoose.pluralize(null);

const products = new Schema({
    sellerId: {
        type: mongoose.Types.ObjectId,
        ref: "sellers",
        required: true,
    },
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "categories",
        required: true,
    },
    winnerId: {
        type: mongoose.Types.ObjectId,
        ref: "buyer",
    },
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    productImage: [
        {
            type: String,
        },
    ],
    brandName: {
        type: String,
        required: true,
    },
    conditionType: {
        type: String,
        enum: [...Object.values(conditionType)],
        required: true,

    },
    termsOfPurchase: {
        type: String,
    },
    faq: {
        type: String,
    },
    isSold: {
        type: Boolean,
        default: false
    },
    minBid: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    }
}, { timestamps: true });
export default model("products", products);