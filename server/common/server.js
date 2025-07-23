import express from "express";
import Mongoose from "mongoose";
import * as http from "http";
import apiErrorHandler from "../helper/apiErrorHandler.js";
// import fileUpload from "express-fileupload";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path'
import * as path from "path";


const app = new express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = path.normalize(`${__dirname}/../..`);


const credentials = (req, res, next) => {
  try {
    const { origin } = req.headers;
    res.set("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Range, Accept-Ranges"
    );
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  } catch (error) {
    next(error);
  }
};
  const filePath = path.resolve(__dirname, "..", "..", "public");
  

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:8055",
  "https://bulk-trade-seven.vercel.app",
  "https://bulk-trade-vt8m.vercel.app"
];

const corsOption = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS for origin: ${origin}`));
    }
  },
  credentials: true,
  exposedHeaders: ["Content-Range", "Accept-Ranges"],
};

class ExpressServer {
  constructor() {
    app.use(express.json({ limit: "1000mb" }));
    app.use(credentials);
    app.use(cors(corsOption));
    app.use(express.urlencoded({ extended: true, limit: "1000mb" }));
    app.use("/public",express.static(path.resolve(__dirname, "..", "..", "public")))

    // app.use(
    //   fileUpload({
    //     useTempFiles: true,
    //     tempFileDir: "/home/admin1/Desktop/node-new-structure/server/tempFile",
    //   })
    // );
  }
  router(routes) {
    routes(app);
    return this;
  }

  configureSwagger(swaggerDefinition) {
    const options = {
      swaggerDefinition,
      apis: [path.resolve(`${root}/server/api/v1/controller/**/*.js`)],
    };

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerJSDoc(options))
    );
    return this;
  }

  handleError() {
    app.use(apiErrorHandler);
    return this;
  }
  configureDb(dbUrl) {
    return new Promise((resolve, reject) => {
      Mongoose.connect(dbUrl)
        .then(() => {
          console.log("Mongodb connection established");
          return resolve(this);
        })
        .catch((err) => {
          console.log(`Error in mongodb connection ${err.message}`);
          return reject(err);
        });
    });
  }
  listen(port) {
    server.listen(port, () => {
      console.log(
        `secure app is listening @port ${port}`,
        new Date().toLocaleString()
      );
    });
    return app;
  }
}
export default ExpressServer;
