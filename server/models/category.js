import { model, Schema } from "mongoose";
import mongoose from "mongoose"
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
mongoose.pluralize(null);

const categories = new Schema({
    categoryName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
}, { timestamps: true });
categories.plugin(aggregatePaginate)
export default model("categories", categories);