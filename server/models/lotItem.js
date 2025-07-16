import { model, Schema } from "mongoose";
import mongoose from "mongoose";
mongoose.pluralize(null);

const lotItemSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    brandName:{
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    perUnitPrice:{
        type: Number,
        required: true,
    },
    productImage:{
        type: String,
        required: true,
    }

})

export default model("lotItem", lotItemSchema);
