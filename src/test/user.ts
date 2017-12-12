import { suite, test } from "mocha-typescript";
import { IUser } from "../interfaces/user";
import { IUserModel } from "../models/user";
import { userSchema } from "../schemas/user";
import mongoose = require("mongoose");
//load environment variables from .env into ENV (process.env).
const dotenv = require('dotenv');
dotenv.load(); //load environment variables from .env into ENV (process.env).

@suite
class UserTest {

  //store test data
  private data: IUser;

  //the User model
  public static User: mongoose.Model<IUserModel>;

  public static before() {
    //use q promises
    global.Promise = require("q").Promise;

    //use q library for mongoose promise
    mongoose.Promise = global.Promise;

    //connect to mongoose and create model
    const MONGODB_CONNECTION: string = "mongodb://"+process.env.MONGO_USER+":"+process.env.MONGO_PASSWORD+"@"+process.env.MONGO_HOST+":"+process.env.MONGO_PORT+"/"+process.env.MONGO_DB;
    let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);
    UserTest.User = connection.model<IUserModel>("User", userSchema);

    //require chai and use should() assertions
    let chai = require("chai");
    chai.should();
  }

  constructor() {
    this.data = {
      email: "yoggifirmanda@gmail.com",
      firstName: "Yoggi",
      lastName: "Firmanda"
    };
  }

  @test("should create a new User")
  public create() {
    //create user and return promise
    return new UserTest.User(this.data).save().then(result => {
      //verify _id property exists
      result._id.should.exist;

      //verify email
      result.email.should.equal(this.data.email);

      //verify firstName
      result.firstName.should.equal(this.data.firstName);

      //verify lastName
      result.lastName.should.equal(this.data.lastName);
    });
  }
}