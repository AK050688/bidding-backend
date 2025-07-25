import { model, Schema } from "mongoose";
import mongoose from "mongoose"
import { statusOfApproval } from "../enums/statusOfApproval.js";

mongoose.pluralize(null);

const bids = new Schema({
    lotId: {
        type: mongoose.Types.ObjectId,
       ref: "lot",
        required: true,
    },
    buyerId: {
        type: mongoose.Types.ObjectId,
        ref: "buyers",
        required: true,
    },

    bidAmount: {
        type: Number,
        required: true,
        min: 0
    },
}, { timestamps: true });
export default model("bids", bids);