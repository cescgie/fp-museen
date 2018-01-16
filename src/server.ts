import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import mongoose = require("mongoose"); //import mongoose

//routes
import { IndexRoute } from "./routes/index";

//API V1
import { ApiV1UserRoute } from "./routes/api/v1/user";
import { ApiV1FigureRoute } from "./routes/api/v1/figure";
import { ApiV1StoryRoute } from "./routes/api/v1/story";

//interfaces
import { IUser } from "./interfaces/user"; //import IUser

//models
import { IModel } from "./models/model"; //import IModel
import { IUserModel } from "./models/user"; //import IUserModel

//schemas
import { userSchema } from "./schemas/user"; //import userSchema

//load environment variables from .env into ENV (process.env).
const dotenv = require('dotenv');
const session = require("express-session");
const fs = require('fs');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const flash = require('connect-flash');
const busboy = require('connect-busboy');

import * as cors from "cors";

/**
 * The server.
 *
 * @class Server
 */
export class Server {

  public app: express.Application;

  private model: IModel; //an instance of IModel

  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    //instance defaults
    this.model = Object(); //initialize this to an empty object

    //create expressjs application
    this.app = express();

    //configure application
    this.config();

    //add routes
    this.routes();

    //add api
    this.api();
  }

  /**
   * Create REST API routes
   *
   * @class Server
   * @method api
   */
  public api() {
    //empty for now
    let router: express.Router;
    router = express.Router();

    // API V1
    ApiV1UserRoute.create(router);
    ApiV1FigureRoute.create(router);
    ApiV1StoryRoute.create(router);

    //use router middleware
    this.app.use(router);
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    //load environment variables from .env into ENV (process.env).
    dotenv.load();

    // npm cors
    this.app.use(cors());

    const MONGODB_CONNECTION: string = "mongodb://"+process.env.MONGO_USER+":"+process.env.MONGO_PASSWORD+"@"+process.env.MONGO_HOST+":"+process.env.MONGO_PORT+"/"+process.env.MONGO_DB;
    
    //add static paths
    this.app.use("/assets", express.static(path.join(__dirname, "public")));

    //configure pug
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "pug");

    //mount logger
    this.app.use(logger("dev"));

    //mount json form parser
    this.app.use(bodyParser.json());

    //mount query string parser
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));

    //mount cookie parker
    this.app.use(cookieParser("SECRET_GOES_HERE"));

    //mount override
    this.app.use(methodOverride());

    //use q promises
    global.Promise = require("q").Promise;
    mongoose.Promise = global.Promise;

    //connect to mongoose
    let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION, { useMongoClient: true });

    //create models
    this.model.user = connection.model<IUserModel>("User", userSchema);

    this.app.use(flash());

    // catch 404 and forward to error handler
    this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
        err.status = 404;
        next(err);
    });

    //error handling
    this.app.use(errorHandler());

    //inis busboy to limit upload
    this.app.use(busboy({
      limits: {
          fileSize: 15 * 1024 * 1024
      }
    }));
  }

  /**
   * Create and return Router.
   *
   * @class Server
   * @method config
   * @return void
   */
  private routes() {
    let router: express.Router;
    router = express.Router();

    //IndexRoute
    IndexRoute.create(router);
    
    //use router middleware
    this.app.use(router);
  }

}