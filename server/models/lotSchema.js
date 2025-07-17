import { model, Schema } from "mongoose";
import mongoose from "mongoose";
mongoose.pluralize(null);

const lotSchema = new Schema(
    {
        lotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "lot",
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        floorPrice: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
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
