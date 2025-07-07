import { model, Schema } from "mongoose";
import mongoose from "mongoose"
import { statusOfApproval } from "../enums/statusOfApproval.js";

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

    isSold: {
        type: Boolean,
        default: false
    },
    isExpired: {
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