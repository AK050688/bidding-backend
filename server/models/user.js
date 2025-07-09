import { model, Schema } from "mongoose";
import Mongoose from "mongoose";
import bcrypt from "bcrypt";
import {status} from "../enums/status.js";
import {userType} from "../enums/userType.js";
import paginate from "mongoose-paginate-v2";
Mongoose.pluralize(null);
const buyers = Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    mobileNumber: {
      type: String,
    },
    addressLine: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpireTime: {
      type: Date,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
      default: userType.BUYER,
    },
    status: {
      type: String,
      default: status.ACTIVE,
    },
  },
  { timestamps: true }
);
buyers.plugin(paginate);

Mongoose.model("buyers", buyers)
  .findOne({ userType: "ADMIN" })
  .then((result) => {
    if (result) {
      console.log("Admin already present.");
    } else {
      let obj = {
        firstName: "super",
        lastName: "admin",
        email: "admin@gmail.com",
        password: bcrypt.hashSync("admin@123", 10),
        mobileNumber: 7985853065,
        addressLine: "shivpur varanasi",
        city: "varanasi",
        state: "uttar pradesh",
        zipCode: "12345",
        countryCode: "+91",
        dateOfBirth: "28-06-2002",
        userType: "ADMIN",
        status: "ACTIVE",
        isVerified: "true",
      };
      Mongoose.model("buyers", buyers)
        .create(obj)
        .then((result1) => {
          if (result1) {
            console.log("Default admin created", result1);
          }
        })
        .catch((err1) => {
          if (err1) {
            console.log("Error while creating default admin", err1);
          }
        });
    }
  });
export default model("buyers", buyers);
