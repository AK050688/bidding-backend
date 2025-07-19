import { model, Schema } from "mongoose";
import mongoose from "mongoose";
mongoose.pluralize(null);

const lotItemSchema = new Schema({

    lotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lot",
        required: true,
    },
    brandName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    perUnitPrice: {
        type: Number,
        required: true,
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers",
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    productImage: {
        type: String,
        required: true,
    },


},
    {
        timestamps: true,
    });

export default model("lotItem", lotItemSchema);
