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
let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION, { useMongoClient: true });
var User: mongoose.Model<IUserModel> = connection.model<IUserModel>("User", userSchema);

const passwordHash = require('password-hash');

import { Library } from "../../library";

const nJwt = require('njwt');
const secureRandom = require('secure-random');

import { Email } from "../../../services/email/facades/email";
import { SendForgotPasswordTemplate } from "../../../services/email/templates/password";
import { SendConfirmationEmailTemplate } from "../../../services/email/templates/confirmation";

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
    protected object_properties: any;

    private lib:Library = new Library();

    // email
    private forgot_password_confirmation: SendForgotPasswordTemplate;
    private template_confirmation: SendConfirmationEmailTemplate;

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

        // Register/create user
        router.post("/api/v1/user", (req: Request, res: Response, next: NextFunction) => {
            new ApiV1UserRoute().create(req, res);
        });

        // Authenticate user
        router.post("/api/v1/user/auth", (req: Request, res: Response) =>{
            new ApiV1UserRoute().auth(req, res);
        });

        // Verify registered user
        router.put("/api/v1/user/activate", (req: Request, res: Response) =>{
            new ApiV1UserRoute().activate(req, res);
        });

        // verify user through client Bearer
        router.get("/api/v1/user/verify_user", (req: Request, res: Response) =>{
            new ApiV1UserRoute().verify_user(req, res);
        });

        // Get user
        router.get("/api/v1/user", (req: Request, res: Response) =>{
            new ApiV1UserRoute().get(req, res);
        });

        // Update one user
        router.put("/api/v1/user", (req: Request, res: Response) =>{
            new ApiV1UserRoute().update(req, res);
        });

        // forget password
        router.post("/api/v1/user/forgot-password", (req: Request, res: Response) => {
            new ApiV1UserRoute().forgot_password(req, res);
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

        // email class: forgot pass
        this.forgot_password_confirmation = new SendForgotPasswordTemplate();
        // email class: email confirm
        this.template_confirmation = new SendConfirmationEmailTemplate();

        // allowed or except user data
        this.object_properties = ['_id', 'createdAt', 'updatedAt', 'email', 'password', 'token', 'active', 'firstname', 'lastname', 'role', 'boxid'];
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
        let appUrl = req.body.appUrl;

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

                    this.template_confirmation.user_email = email;
                    this.template_confirmation.lastname = lastname;
                    this.template_confirmation.confirmURL = appUrl + '/activate?email=' + email + '&token=' + verify_token;

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

                            const EMAIL: string = user_data.email;
                            const NAME: string = '';

                            // set to email template
                            this.template_confirmation.email.addTo(EMAIL, NAME);

                            // send to email
                            this.template_confirmation.send()
                                .then((response) => {
                                    // Generate Token
                                    let token: any = this.generateToken(dataForToken);

                                    this.success_response = {
                                        status: 200,
                                        message: 'USER_CREATE_SUCCESS',
                                        content: {
                                            token: token
                                        }
                                    }

                                    // Response as json
                                    res.json(this.success_response);
                                })
                                .catch(error => {
                                    this.error_response = {
                                        code: error.code,
                                        message: error.message
                                    };
                                    res.json(this.error_response);
                                });

                            return;                           
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
     * Authenticate user
     * @param req token,email,password
     * @param res status, content(id, role, JWT token)
     */
    public auth(req: Request, res: Response){
        let email = req.body.email;
        let password = req.body.password;
        
        // Check if email & password exist
        if(email && password){
            User.findOne({email:email}).then(result => {
                if(!result || result === null){
                    this.error_response = {
                        status: 302,
                        message: "NO_USER_EXISTS",
                    };
                    res.send(this.error_response);
                }else{
                    //check if user already active
                    if(!result.active){
                        this.error_response = {
                            status: 306,
                            message: "USER_UNVERIFIED",
                        };
                        res.send(this.error_response);
                    }else 
                    if(!this.verifyPassword(password, result.password)){ 
                        // if user password unverified
                        this.error_response = {
                            status: 305,
                            message: "CREDENTIALS_NOT_MATCHED",
                        };
                        res.send(this.error_response);
                    }else{
                        let user_data:type.userDataToken = {
                            _id: result._id,
                            role:result.role
                        };
                        // Generate Token
                        let token:any = this.generateToken(user_data);

                        // Send response data including token, id, role
                        let responseData:any = {
                            status:200,
                            message: 'USER_AUTH_SUCCESS',
                            content:{
                                token:token,
                                id:result._id,
                                role:result.role                                
                            }
                        }

                        // Response data as json
                        res.send(responseData);
                    }
                }
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
     * Method to activate user
     * @param req 
     * @param res 
     */
    public activate(req: Request, res: Response){
        let email = req.body.email;
        let token = req.body.token;
        
        // Check if email & token exist
        if(email && token){
            User.findOne({email:email}, (err, user)=> {
                if(err){
                    this.error_response = {
                        "status": 402,
                        "message":"DATABASE_ERROR"
                    };
                    res.send(this.error_response);
                    
                }else{
                    if(!user){
                        this.error_response = {
                            "status": 302,
                            "message":"NO_USER_EXISTS"
                        };
                        res.json(this.error_response);
                    }else{
                        if(user.token !== token || user.token === '' || user.token === null){
                            this.error_response = {
                                "status": 304,
                                "message":"INVALID_TOKEN"
                            };
                            res.send(this.error_response);                                               
                        }else{
                            user.set({ token: null, active:true });
                            user.save((err, updatedUser)=> {
                                if(err){
                                    this.error_response = {
                                        status: 402,
                                        message:"DATABASE_ERROR"
                                    };
                                    res.send(this.error_response);
                                }else{
                                    this.success_response = {
                                        status: 200,
                                        message: "USER_ACTIVATE_SUCCESS"
                                    };
                                    res.send(this.success_response);
                                }
                            });
                        }
                    }
                }
            });
        }else{
            this.error_response = {
                "status": 303,
                "message":"EMAIL_NOT_AVAILABLE"
            };
            res.json(this.error_response);
        }
    }

    /**
     * Verify jwt token
     * @param req 
     * @param res 
     */
    public verify_user(req: Request, res: Response){
        if(req.headers['authorization'] && req.headers['authorization'] !== null){
            let headerAuth:any = req.headers['authorization'];            
            /**
             * get token from headerAuth
             * check if token valid with
             */
            let getToken:any = headerAuth.split(' ');
            // verify token
            nJwt.verify(getToken[1],this.secret_key, (err,token)=>{
                if(err){
                    // respond to request with error
                    // console.log('token invalid');
                    res.send({ status: 401 });                                
                }else{
                    // continue with the request
                    // console.log('token valid');
                    res.send({ status: 200, body: { status: 'ok' } });            
                }
            });
        }else{
            // console.log('end');
            res.send({ status: 401 });  
        }
    }

    /**
     * Method to get users (if sent param included _id or email or user, then get ONE user)
     * @param req body: (email/username), token . If req.email/req username empty, return all users
     * @param res {_id,createdAt,updatedAt,firstname,lastname,email}
     */
    public get(req: Request, res: Response){

        if(req.headers['authorization'] && req.headers['authorization'] !== null){
            let headerAuth:any = req.headers['authorization'];            
            
            this.verifyJWT(headerAuth).then((resp)=>{
                let userID = resp.body.sub;
                let userRole = resp.body.permissions;

                if(!resp){
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.json(this.error_response);
                }else{
                    let email:string = req.query.email;
                    let username:string = req.query.username;
                    let _id:string = req.query._id;
                    
                    let QUERY:any;
        
                    if(email || username || _id){
                        if(email && email!==null){
                            QUERY = {
                                email:email
                            }
                        }else if(username && username !==null){
                            QUERY = {
                                username:username
                            }
                        }else if(_id && _id !==null){
                            QUERY = {
                                _id:_id
                            }
                        }
                        
                        User.findOne(QUERY, {}, (err, user)=> {
                            let res_json:any;            
                            if(err){
                                this.error_response = {
                                    "status": 309,
                                    "message":"QUERY_ERROR",
                                    "content": err.message
                                };
                                res_json = this.error_response;
                            }else if(!user || user === null){
                                this.error_response = {
                                    "status": 308,
                                    "message":"NO_DATA_FOUND"
                                };
                                res_json = this.error_response;
                            }else{
                                let permissions: any;
                                let status: string;

                                // Permissions for user 
                                if(userRole == 1 || userRole == 2 || userID == user._id){
                                    permissions = this.object_properties;
                                }else{
                                    permissions = ['password','active','token','boxid'];
                                    status = 'except';
                                }

                                let user_data_ : any = this.lib.dataWithPermissions(user,permissions,status);

                                this.success_response = {
                                    status:200,
                                    message:'USER_READ_SUCCESS',
                                    content: user_data_
                                }

                                res_json = this.success_response;
                            }
                            res.json(res_json);                                                        
                        })
                    }else{
                        // Get all users
                        User.find({}, {}, (err, user)=> {
                            let res_json:any;            
                            if(err){
                                this.error_response = {
                                    "status": 309,
                                    "message":"QUERY_ERROR",
                                    "content": err.message
                                };
                                res_json = this.error_response;
                            }else if(!user || user === null){
                                this.error_response = {
                                    "status": 308,
                                    "message":"NO_DATA_FOUND"
                                };
                                res_json = this.error_response;
                            }else{
                                let permissions: any;
                                let status: string;

                                // Permissions for user role 3 else *all
                                if(userRole == 3){
                                    status = 'only';
                                    permissions = ['_id', 'createdAt', 'updatedAt', 'email', 'active', 'firstname', 'lastname', 'role', 'boxid'];
                                }else{
                                    status = 'only';
                                    permissions = this.object_properties;
                                }

                                let user_data_:any=[];
                                
                                for (let i = 0; i < user.length; i++) {
                                    user_data_[i] = {};
                                    user_data_[i] = this.lib.dataWithPermissions(user[i],permissions,status);
                                }

                                this.success_response = {
                                    status:200,
                                    message:'USER_READ_SUCCESS',
                                    content: user_data_
                                }

                                res_json = this.success_response;                                
                            }
                            res.json(res_json);
                        });
                    }
                }
            }).catch((err)=>{
                this.error_response = {
                    "status": 406,
                    "message": 'SIGNATURE_VERIFICATION_FAILED'
                };
                res.json(this.error_response); 
            })
        }else{
            this.error_response = {
                "status": 401,
                "message":"NOT_AUTHORIZED"
            };
            res.json(this.error_response);
        }
    }

    /**
     * Method to update user data
     * @param req token, {dinamic properties}
     * @param res status
     */
    public update(req: Request, res: Response){

        if(req.headers['authorization'] && req.headers['authorization'] !== null){
            let headerAuth:any = req.headers['authorization'];            
            
            this.verifyJWT(headerAuth).then((resp)=>{
                let userID = resp.body.sub;
                let userRole = resp.body.permissions;
                
                if(!resp){
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.json(this.error_response);
                }else{
                    let email:string = req.query.email;
                    let username:string = req.query.username;
                    let _id:string = req.query._id;

                    let QUERY:any;
                    
                    if(email || username || _id){
                        if(email && email!==null){
                            QUERY = {
                                email:email
                            }
                        }else if(username && username !==null){
                            QUERY = {
                                username:username
                            }
                        }else if(_id && _id !==null){
                            QUERY = {
                                _id:_id
                            }
                        }

                        User.findOne(QUERY, {}, (err, user)=> {
                            let res_json:any;            
                            if(err){
                                this.error_response = {
                                    "status": 309,
                                    "message":"QUERY_ERROR",
                                    "content": err.message
                                };
                                res.json(this.error_response);
                            }else if(!user || user === null){
                                this.error_response = {
                                    "status": 308,
                                    "message":"NO_DATA_FOUND"
                                };
                                res.json(this.error_response);
                            }else{
                                // if role is 1(master) or 2(admin) or userID is matched then update allowed
                                if(userRole == 1 || userRole == 2 || userID == user._id){
                                    let arrayKey:any = [];
                                    
                                    for (var key in req.body) {
                                        arrayKey.push(key);                    
                                    }
                        
                                    // remove token, email and active from arrayKey to prevent update these two keys
                                    if (arrayKey.indexOf('email') !== -1) {
                                        arrayKey.splice(arrayKey.indexOf('email'), 1);
                                    }
                                    if (arrayKey.indexOf('token') !== -1) {
                                        arrayKey.splice(arrayKey.indexOf('token'), 1);
                                    }
                                    if (arrayKey.indexOf('active') !== -1) {
                                        arrayKey.splice(arrayKey.indexOf('active'), 1);
                                    }
                        
                                    let data_toUpdate:any ={};
                                    // update only given data
                                    for (let i = 0; i < arrayKey.length; i++) {
                                        // if password given, hash it
                                        if(arrayKey[i]=='password'){
                                            data_toUpdate[arrayKey[i]] = this.hashPassword(req.body[arrayKey[i]]);
                                        }else{
                                            data_toUpdate[arrayKey[i]] = req.body[arrayKey[i]];                    
                                        }
                                    }
                                    // update time
                                    data_toUpdate['updatedAt'] = new Date();

                                    user.set(data_toUpdate);
                                    user.save((err, updatedUser)=> {
                                        if(err){
                                            this.error_response = {
                                                "status": 402,
                                                "message":"DATABASE_ERROR"
                                            };
                                            res.send(this.error_response);
                                        }else{
                                            this.success_response = {
                                                "status": 200,
                                                "message": "USER_UPDATE_SUCCESS",
                                                "content": updatedUser
                                            };
                                            res.send(this.success_response);
                                        }
                                    });
                                }else{
                                    // user does not have authorization
                                    this.error_response = {
                                        "status": 410,
                                        "message": "NOT_AUTHORIZED"
                                    };
                                    res.json(this.error_response);
                                }
                            }
                        });
                    }
                }
            }).catch((err)=>{
                this.error_response = {
                    "status": 406,
                    "message": 'SIGNATURE_VERIFICATION_FAILED'
                };
                res.json(this.error_response); 
            })
        }else{
            this.error_response = {
                "status": 401,
                "message": "NOT_AUTHORIZED"
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

    /**
     * Method to send email forget password
     * @param req 
     * @param res 
     */
    public forgot_password(req: Request, res: Response) {
        let lang = req.headers['lang'];
        let email = req.body.email;
        let appUrl = req.body.appUrl;

        // Check if email exists
        if (email || appUrl) {
            User.findOne({ email: req.body.email }, (err, user) => {
                if (err) {
                    this.error_response = {
                        "status": 302,
                        "message": "DATABASE_ERROR"
                    };
                    res.json(this.error_response);
                } else {
                    if (!user) {
                        this.error_response = {
                            "status": 304,
                            "message": "NO_USER_EXISTS"
                        };
                        res.send(this.error_response);
                    } else {
                        let reset_token: string = this.hashPassword(email);

                        let user_data: type.user = {
                            token: reset_token,
                            updatedAt: new Date()
                        };

                        this.forgot_password_confirmation.forgotPasswordURL = appUrl + '/password-reset?email=' + email + '&token=' + reset_token;
                        this.forgot_password_confirmation.email_user = email;
                        this.forgot_password_confirmation.firstname = user.firstname;
                        this.forgot_password_confirmation.lastname = user.lastname;

                        user.set(user_data);
                        user.save((err, updatedUser) => {
                            if (err) {
                                this.error_response = {
                                    "status": 402,
                                    "message": "DATABASE_ERROR"
                                };
                                res.json(this.error_response);
                            } else {
                                const EMAIL: string = user.email;
                                const NAME: string = '';

                                // set to email template
                                this.forgot_password_confirmation.email.addTo(EMAIL, NAME);

                                // send to email
                                this.forgot_password_confirmation.send()
                                    .then((response) => {
                                        this.success_response = {
                                            status: 200,
                                            message: "USER_FORGOTPASSWORD_SUCCESS"
                                        };
                                        res.send(this.success_response);
                                    }).catch(error => {
                                        this.error_response = {
                                            code: error.code,
                                            message: error
                                        };
                                        res.json(this.error_response);
                                    });
                            }
                        });
                    }
                }
            });
        } else {
            this.error_response = {
                "status": 307,
                "message": "DATA_NOT_COMPLETE"
            };
            res.json(this.error_response);
        }
    }
}