import jwt from "jsonwebtoken";
import config from "config";
import userModel from "../../server/models/user.js";
import apiError from "./apiError.js";
import responseMessages from "../../assets/responseMessages.js";
import services from "../api/v1/services/user.js";
const { findUserById } = services
export default {
    async verifyToken(req, res, next) {

        const token = req.headers["authorization"];
        if (!token) {
            return res.json(apiError.notFound(responseMessages.NO_TOKEN))
        }
        try {
            jwt.verify(token, config.get('jwtsecret'), async (err, result) => {
                if (err) {
                    if (err.name == "TokenExpiredError") {
                        return res.json(apiError.badRequest(responseMessages.TOKEN_EXPIRED))
                    } else {
                        return res.json(apiError.unauthorized(responseMessages.UNAUTHORIZED))
                    }
                } else {
                    const userResult = await findUserById({ _id: result._id })
                    if (!userResult) {
                        return res.json(apiError.notFound(responseMessages.USER_NOT_FOUND))
                    }
                    else if (userResult.status == 'BLOCKED') {
                        return res.json(apiError.unauthorized(responseMessages.BLOCK_BY_ADMIN))
                    }
                    else if (userResult.status == 'DELETED') {
                        return res.json(apiError.unauthorized(responseMessages.DELETE_BY_ADMIN))
                    } else {
                        req.userId = userResult._id;
                        return next();
                    }

                }
            })
        } catch (error) {
            console.log("Error", error);
            return next(error)
        }






    }

}