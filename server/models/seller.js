import { model, Schema } from "mongoose";
import mongoose from "mongoose"
import { statusOfApproval } from "../enums/statusOfApproval";
import { required } from "joi";

mongoose.pluralize(null);

const sellers = new Schema({
    buyerId: {
        type: mongoose.Types.ObjectId,
        ref: "buyers",
        required: true,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    orgnizationName: {
        type: String,
    },
    orgnizationType: {
        type: String,
    },
    orgnizationPhone: {
        type: String,
    },
    orgnizationEmail: {
        type: String,
    },
    orgnizationWebsite: {
        type: String,
    },
    gstNumber: {
        type: String
    },
    subject: {
        type: String,
        required:true
    },
    remark: {
        type: String,
    },
    statusOfApproval: {
        type: String,
        enum: [...Object.values(productSize), statusOfApproval.PENDING],
    }
}, { timestamps: true });
export default model("sellers", sellers);