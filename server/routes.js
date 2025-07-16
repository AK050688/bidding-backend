import user from "./api/v1/controller/user/routes.js";
import admin from "./api/v1/controller/admin/routes.js";
import category from "./api/v1/controller/category/routes.js"
import seller from "./api/v1/controller/seller/routs.js"
// import product from "./api/v1/controller/product/routes.js"
import bid from "./api/v1/controller/bid/routes.js"
import support from "./api/v1/controller/support/routes.js"
import transaction from './api/v1/controller/transaction/router.js'



export default function routes(app) {
    app.use('/api/v1/user', user)
    app.use("/api/v1/admin", admin)
    app.use("/api/v1/category", category)
    app.use("/api/v1/seller", seller)
    // app.use("/api/v1/product", product)
    app.use("/api/v1/bid", bid)
    app.use("/api/v1/support",support)
    app.use("/api/v1/transaction",transaction)



}