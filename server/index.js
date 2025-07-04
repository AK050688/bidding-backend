import Config from 'config'
import Routes from "./routes.js";
import Server from "./common/server.js"
import {DateTime} from "luxon";
DateTime.now().setZone('asia/kolkata').minus({weeks:1}).endOf('day').toISO();

const dbUrl = `${Config.get(
  "databaseUrl"
)}`;
const server = new Server()
  .router(Routes)
  .configureSwagger(Config.get("swaggerDefinition"))
  .handleError()
  .configureDb(dbUrl)
  .then((_server) => _server.listen(Config.get("port")));

export default server;






