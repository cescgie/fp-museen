/// <reference path="../../type.ts" />

import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "../../route";

import { IUser } from "../../../interfaces/user";
import { userSchema } from "../../../schemas/user";
import { IUserModel } from '../../../models/user';

//use q promises
global.Promise = require("q").Promise;

//import mongoose
import mongoose = require("mongoose");

//use q library for mongoose promise
mongoose.Promise = global.Promise;

//load environment variables from .env into ENV (process.env).
const dotenv = require('dotenv');
dotenv.load(); //load environment variables from .env into ENV (process.env).

//connect to DB
const MONGODB_CONNECTION: string = "mongodb://"+process.env.MONGO_USER+":"+process.env.MONGO_PASSWORD+"@"+process.env.MONGO_HOST+":"+process.env.MONGO_PORT+"/"+process.env.MONGO_DB;
let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);
var User: mongoose.Model<IUserModel> = connection.model<IUserModel>("User", userSchema);

const passwordHash = require('password-hash');

import { Library } from "../../library";

const nJwt = require('njwt');
const secureRandom = require('secure-random');

/**
 * 
 * / route
 *
 * @class User
 */
export class ApiV1UserRoute extends BaseRoute {
    protected error_response:any;
    protected success_response:any;  
    protected secret_key:string;
    protected baseURL:string;
    protected token:string;    
    
    /**
     * Create the routes.
     *
     * @class ApiV1UserRoute
     * @method create
     * @static
     */
    public static create(router: Router) {
        //log
        console.log("[ApiV1UserRoute::create] Creating ApiV1UserRoute route.");

        router.post("/api/v1/user", (req: Request, res: Response, next: NextFunction) => {
            new ApiV1UserRoute().create(req, res);
        });
    }

    /**
     * Constructor
     *
     * @class ApiV1UserRoute
     * @constructor
     */
    constructor() {
        super();  
        this.token = process.env.API_AUTH_TOKEN;        
        // create secret key
        this.secret_key = process.env.SECRET_KEY;
        // base app URL
        this.baseURL = process.env.APP_BASEURL;
    }
    
    /**
     * Method to create user
     * @param req email, password
     * @param res JWT token
     */
    public create(req: Request, res: Response){
        let firstname = req.body.firstname;
        let lastname = req.body.lastname;
        let email = req.body.email;
        let password = req.body.password;

         // Check if mandatory values exist
         if(firstname && lastname && email && password){
            // check if already registered
            User.findOne({email:email}).then(result => {
                if(result && result !== null){
                    this.error_response = {
                        "status": 301,
                        "message":"EMAIL_EXISTS"
                    };
                    res.json(this.error_response);
                }else{
                    // hash password
                    let hashedPassword:string = this.hashPassword(password);
                    // hash email used as verify user token
                    let verify_token:any = this.hashPassword(email);
                    
                    let user_data:type.user = {
                        firstname:firstname,
                        lastname:lastname,
                        email: email,
                        password:hashedPassword,
                        token:verify_token,
                        updatedAt:new Date()
                    };

                    // save to DB
                    let user_model = new User(user_data)
                    user_model.save((err, data)=>{
                        if(err){
                            this.error_response = {
                                "status": 402,
                                "message":"DATABASE_ERROR"
                            };
                            res.json(this.error_response);
                        }else{
                            let dataForToken:type.userDataToken={
                                _id:data._id,
                                role:data.role,
                            }

                            // Generate Token
                            let token:any = this.generateToken(dataForToken);
                            
                            this.success_response = {
                                status:200,
                                message:'USER_CREATE_SUCCESS',
                                content: {
                                    token:token
                                }
                            }
                            res.json(this.success_response);                            
                        }
                    }).catch(error => {
                        this.error_response = {
                            code:error.code,
                            message:error.message 
                        };
                        res.json(this.error_response);
                    });

                    return;
                }
            })
            .catch((err)=>{
                let options:any = {
                    "status": 404,
                    "message": 'DATABASE_ERROR'
                };
                res.send(options);
            });
        }else{
            this.error_response = {
                "status": 307,
                "message":"DATA_NOT_COMPLETE"
            };
            res.json(this.error_response);
        }
    }

    /**
     * generate token
     * @param user_data  
     */
    generateToken(user_data:type.userDataToken) {
        
             let claims:any = {
                 sub: user_data._id,
                 iss: this.baseURL,
                 permissions: user_data.role
             }
     
             let jwt = nJwt.create(claims,this.secret_key);
     
             let token = jwt.compact();
     
             return token;
         }
     
         /**
          * To hash password
          * Source: https://github.com/davidwood/node-password-hash
          * @param password 
          */
         hashPassword(password:string){
             /**
              * passwordHash.generate(password) : generate
              * passwordHash.verify('right_password', hashedPassword); // true
              * passwordHash.verify('wrong_password', hashedPassword); // false
              * passwordHash.isHashed('right_password'); // false
              * passwordHash.isHashed(hashedPassword); // true
              */
             let hashedPassword:string = passwordHash.generate(password);
             
             return hashedPassword;
         }
     
         /**
          * Verify password
          * @param password 
          * @param DBPassword 
          */
         verifyPassword(password:string, DBPassword:string){
             let verify:boolean=passwordHash.verify(password, DBPassword); 
             return verify;
         }
     
         /**
          * Verify JWT
          * @param headerAuth 
          * return jwt header & body in json
          */
         public verifyJWT(headerAuth:string): Promise<any>{
             /**
              * get token from headerAuth
              * check if token valid with
              */
             let getToken:any = headerAuth.split(' ');
     
             // TODO
             // store & use sign key in DB
     
             // verify token
             return new Promise((resolve,reject)=>{
                 nJwt.verify(getToken[1],this.secret_key, (err,verifiedJwt)=>{
                     if(err){
                         reject(err);                             
                     }else{
                         resolve(verifiedJwt);       
                     }
                 });
             });
         }
}