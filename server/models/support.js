import { model, Schema } from "mongoose";
import Mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";
import { supportStatus } from "../enums/supportStatu.js";
Mongoose.pluralize(null);
const supports = Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true

        },
        mobileNumber: {
            type: String,
            required: true

        },
        subject: {
            type: String,
            required: true

        },
        description: {
            type: String,
            required: true

        },
        supportStatus: {
            type: String,
            enum: [...Object.values(supportStatus)],
            default: supportStatus.PENDING,
        },
    
        
    },
    { timestamps: true }
);
supports.plugin(paginate);


export default model("supports", supports);
