import user from "./api/v1/controller/user/routes.js";
import admin from "./api/v1/controller/admin/routes.js";
import category from "./api/v1/controller/category/routes.js"



export default function routes(app) {
    app.use('/api/v1/user', user)
    app.use("/api/v1/admin", admin)
    app.use("/api/v1/category", category)



}