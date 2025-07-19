import { model, Schema } from "mongoose";
import mongoose from "mongoose";
import { conditionType } from "../enums/conditionType.js";
mongoose.pluralize(null);

const lotSchema = new Schema(
    {
        productName: {
            type: String,
            required: true,
        },
        totalBrand:{
            type: String,
            required: true,
        },
        lotItemId: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "lotItem",

        }],
        lotImage: [{
            type: String,
        }],
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            required: true,
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "sellers",
            required: true,
        },
        bidId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bid",
        },
        floorPrice: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        maxBidAmount:{
            type:Number,
            require:true,

        },
        conditionType: {
            type: String,
            enum: [...Object.values(conditionType)],
            required: true,

        },
        location: {
            type: String,
            required: true,
        },
        winnerId: {
            type: mongoose.Types.ObjectId,
            ref: "buyer",
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
        },
        isSold: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export default model("lot", lotSchema);
