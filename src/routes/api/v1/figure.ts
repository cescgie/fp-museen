/// <reference path="../../type.ts" />

import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "../../route";

import { IFigure } from "../../../interfaces/figure";
import { figureSchema } from "../../../schemas/figure";
import { IFigureModel } from '../../../models/figure';

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
var Figure: mongoose.Model<IFigureModel> = connection.model<IFigureModel>("Figure", figureSchema);

const passwordHash = require('password-hash');

import { Library } from "../../library";

const nJwt = require('njwt');
const secureRandom = require('secure-random');

import { ApiV1UserRoute } from "./user";
import { ObjectId } from "bson";

/**
 * / route
 * @class Figure
 */
export class ApiV1FigureRoute extends BaseRoute {
    protected error_response:any;
    protected success_response:any;  
    protected secret_key:string;
    protected baseURL:string;
    protected token:string;    

    private lib:Library = new Library();
    private _apiV1UserRoute:ApiV1UserRoute = new ApiV1UserRoute();

    /**
     * Create the routes.
     *
     * @class ApiV1FigureRoute
     * @method create
     * @static
     */
    public static create(router: Router) {
        //log
        console.log("[ApiV1FigureRoute::create] Creating ApiV1FigureRoute route.");

        // Create figure
        router.post("/api/v1/figure", (req: Request, res: Response, next: NextFunction) => {
            new ApiV1FigureRoute().create(req, res);
        });

        // Get Figure(s)
        router.get("/api/v1/figure", (req: Request, res: Response) =>{
            new ApiV1FigureRoute().get(req, res);
        });

         // Update Figure
         router.put("/api/v1/figure", (req: Request, res: Response) =>{
            new ApiV1FigureRoute().update(req, res);
        });

        // Delete figure
        router.delete("/api/v1/figure", (req: Request, res: Response) =>{
            new ApiV1FigureRoute().delete(req, res);
        });
    }

    /**
     * Method to create figure.
     * JWT Authorization needed.
     * 
     * @param req HEADER: JWT Token(!). BODY: name, description
     * @param res {status, message, content}
     */
    public create(req: Request, res: Response){
        
        if(req.headers['authorization'] && req.headers['authorization'] !== null){
            let headerAuth:any = req.headers['authorization'];            
            
            this._apiV1UserRoute.verifyJWT(headerAuth).then((jwt)=>{
                if(!jwt){
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.json(this.error_response);
                }else{
                    // JWT BODY
                    let userID = jwt.body.sub;
                    let userRole = jwt.body.permissions;

                    // FORM BODY
                    let name:string = req.body.name;
                    let description:string = req.body.description;

                    // Check if mandatory values exist
                    if( 
                        name && name !==null &&
                        description && description !==null
                    ){
                        let figure_data:IFigure = {
                            name:name,
                            description:description,
                            createdBy:userID,
                            updatedBy:userID                                       
                        };

                        /**
                         * TODO!
                         * Read available uploaded image by path+userID+-figure
                         * If exists, get filedir then rename file to path+userID+respCreateFigure.id
                         */
                        this.createFigure(figure_data, userID).then(respCreateFigure=>{
                            res.send(respCreateFigure);
                        }).catch(err=>{
                            res.send(err);
                        })

                    }else{
                        this.error_response = {
                            "status": 307,
                            "message":"QUERY_NOT_COMPLETE"
                        };
                        res.json(this.error_response);
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
     * Method to get figure(s) 
     * JWT Authorization needed.
     * 
     * @param req HEADER: JWT Token(!). QUERY: createdBy, figureId, createdBy, createdAt, enabled
     * @param res {status,message,content}
     */
    public get(req: Request, res: Response){
        
        if(req.headers['authorization'] && req.headers['authorization'] !== null){
            let headerAuth:any = req.headers['authorization'];            
            
            this._apiV1UserRoute.verifyJWT(headerAuth).then((jwt)=>{
                if(!jwt){
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.json(this.error_response);
                }else{
                    // JWT BODY
                    let userID = jwt.body.sub;
                    let userRole = jwt.body.permissions;

                    // QUERY
                    let req_query = req.query;
                    this.getFigure(req_query).then(respGetFigure=>{
                        res.send(respGetFigure);
                    }).catch(err=>{
                        res.send(err);
                    })             
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
     * 
     * Method to delete figure.
     * JWT Authorization needed.
     * 
     * @param req HEADER: JWTtoken(!). QUERY: figureId, createdBy(!). 
     * @param res status
     */
    public delete(req: Request, res: Response){
        if(req.headers['authorization'] && req.headers['authorization'] !== null){
            let headerAuth:any = req.headers['authorization'];            
            
            this._apiV1UserRoute.verifyJWT(headerAuth).then((jwt)=>{
                if(!jwt){
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.json(this.error_response);
                }else{
                    // JWT BODY
                    let userID = jwt.body.sub;
                    let userRole = jwt.body.permissions;
                    
                    // QUERY
                    let createdBy:string = req.query.createdBy;
                    let figureId:number = req.query.figureId;

                    let QUERY:any = {};

                    // Check if mandatory values exist
                    if(figureId && figureId!==null){
                        if(createdBy && createdBy!==null){
                            QUERY = {
                                _id:figureId,
                                createdBy:createdBy                                
                            }
                        }else{
                            QUERY = {
                                _id:figureId
                            }
                        }

                        /**
                         * Delete permission roles: admin, admin, createdBy
                         */
                        this.populateFigure(QUERY).then((response:any)=>{
                            if(response.status !== 200){
                                res.json(response);
                            }else{
                                let figureContent: any = response.content[0];
                                if(userRole == 1 || userRole == 2 || figureContent.createdBy == userID){
                                    Figure.findOne(QUERY).remove().exec((err, data)=>{
                                        if(err){
                                            this.error_response = {
                                                "status": 402,
                                                "message":"DATABASE_ERROR"
                                            };
                                            res.json(this.error_response);
                                        }else{
                                            this.success_response = {
                                                "status": 200,
                                                "message": "FIGURE_DELETE_SUCCESS"
                                            };
                                            res.json(this.success_response);
                                        }
                                    });
                                }else{
                                    this.error_response = {
                                        "status": 401,
                                        "message": "NOT_AUTHORIZED"
                                    };
                                    res.json(this.error_response);
                                }
                            }
                        }).catch(err=>{
                            res.json(err);
                        })
                    }else{
                        this.error_response = {
                            "status": 307,
                            "message":"QUERY_NOT_COMPLETE"
                        };
                        res.json(this.error_response);
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

    getFigure(param:any):Promise<any>{
        return new Promise((resolve,reject)=>{

            let QUERY:any;
            let MATCH: any = {};

            if(param.createdBy && param.createdBy !== 'null' && param.createdBy !== undefined){
                MATCH['createdBy'] = param.createdBy
            }

            if(param.updatedBy && param.updatedBy !== 'null' && param.updatedBy !== undefined){
                MATCH['updatedBy'] = param.updatedBy
            }

            if(param.figureId && param.figureId !== 'null' && param.figureId !== undefined){
                let id = param.figureId
                MATCH['_id'] =  new ObjectId(id)
            }

            if(param.enabled && param.enabled !== 'null' && param.enabled !== undefined){
                MATCH['enabled'] = JSON.parse(param.enabled)
            }

            QUERY = [
                { $match: MATCH },
            ];

            this.populateFigureQuery(QUERY).then((response)=>{
                resolve(response);
            }).catch(err=>{
                reject(err);
            }) 
        })
    }

    populateFigureQuery(QUERY:any):Promise<any>{
        return new Promise((resolve,reject)=>{
            Figure.aggregate(
                QUERY, (err,result) =>{
                    if(err){
                        let options:any = {
                            status: 404,
                            message: err.message
                        };
                        reject(options);
                    }else{
                        let options:any = {
                            status: 200,
                            content: result
                        };
                        resolve(options);
                    }
                });
        })
    }

    /**
     * create new figure(!)
     */
    createFigure(figureData:IFigure, userID:string):Promise<any>{
        return new Promise((resolve,reject)=>{
            //save figureData to DB
            let figure_model = new Figure(figureData)
            figure_model.save((err, createdFigure)=>{
                if(err){
                    this.error_response = {
                        "status": 309,
                        "message":"QUERY_ERROR",
                        "content": err.message                                                
                    };
                    resolve(this.error_response);
                }else{
                    this.success_response = {
                        "status": 200,
                        "message": "FIGURE_CREATE_SUCCESS",
                        "content": createdFigure
                    };
                    resolve(this.success_response);
                }
            });
        });
    }

    /**
     * Populate Figure
     * @param QUERY 
     */
    populateFigure(QUERY?:any):Promise<any>{
        return new Promise((resolve,reject)=>{
            if(Object.keys(QUERY).length !== 0){
                Figure.find(QUERY, null , {sort:{createdAt:-1}}, (err, figure)=> {
                    if(err){
                        this.error_response = {
                            "status": 309,
                            "message":"QUERY_ERROR",
                            "content": err.message
                        };
                        reject(this.error_response);
                    }else if(!figure || figure === null || figure.length < 1){
                        this.error_response = {
                            "status": 331,
                            "message":"NO_FIGURE_FOUND"
                        };
                        reject(this.error_response);
                    }else{
                        this.success_response = {
                            status:200,
                            message:'FIGURE_READ_SUCCESS',
                            content: figure
                        }
                        resolve(this.success_response)
                    }
                })
            }else{
                Figure.find({}, null , {sort:{createdAt:-1}},(err, figure)=> {
                    if(err){
                        this.error_response = {
                            "status": 309,
                            "message":"QUERY_ERROR",
                            "content": err.message
                        };
                        reject(this.error_response);
                    }else if(!figure || figure === null || figure.length < 1){
                        this.error_response = {
                            "status": 331,
                            "message":"NO_FIGURE_FOUND"
                        };
                        reject(this.error_response);
                    }else{
                        this.success_response = {
                            status:200,
                            message:'FIGURE_READ_SUCCESS',
                            content: figure
                        }
                        resolve(this.success_response)
                    }
                });
            }
        });
    }

    /**
     * Method to update figure.
     * JWT Authorization needed.
     * _id, createdBy, createdAt are not allowed to be updated
     * 
     * @param req HEADER: JWTtoken(!). QUERY: figureId(!). BODY: {dinamic properties}. 
     * @param res status
     */
    public update(req: Request, res: Response){
        if(req.headers['authorization'] && req.headers['authorization'] !== null){
            let headerAuth:any = req.headers['authorization'];            
            
            this._apiV1UserRoute.verifyJWT(headerAuth).then((jwt)=>{
                if(!jwt){
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.json(this.error_response);
                }else{
                    // JWT BODY
                    let userID = jwt.body.sub;
                    let userRole = jwt.body.permissions;
                    // QUERY
                    let figureId:string = req.query.figureId;
                    
                    // Check if mandatory values exist
                    if( figureId ){
                        this.populateFigure({_id:figureId}).then(respPopulateFigure=>{
                            let figureContent = respPopulateFigure.content[0];

                            /**
                             * #RolePermission
                             * Check role permission
                             * Permission role: Admin, Master, createdBy
                            */
                            if(userRole == 1 || userRole == 2 || figureContent.createdBy == userID ){
                                // Init all given req body parameters
                                let arrayKey:any = [];
                                for (var key in req.body) {
                                    arrayKey.push(key);                    
                                }
                                // Avoid updating primary properties
                                if (arrayKey.indexOf('createdAt') !== -1) {
                                    arrayKey.splice(arrayKey.indexOf('createdAt'), 1);
                                }
                                if (arrayKey.indexOf('createdBy') !== -1) {
                                    arrayKey.splice(arrayKey.indexOf('createdBy'), 1);
                                }

                                let data_toUpdate:any ={};
                                // update only given req body parameters except primary properties
                                for (let i = 0; i < arrayKey.length; i++) {
                                    data_toUpdate[arrayKey[i]] = req.body[arrayKey[i]];                    
                                }
                                
                                // update time
                                data_toUpdate['updatedAt'] = new Date();
                                data_toUpdate['updatedBy'] = userID; 
                                   
                                // Update figure
                                figureContent.set(data_toUpdate);
                                figureContent.save((err, updatedFigure)=> {
                                    if(err){
                                        this.error_response = {
                                            "status": 309,
                                            "message":"QUERY_ERROR",
                                            "content": err.message
                                        };
                                        res.send(this.error_response);
                                    }else{
                                        this.success_response = {
                                            "status": 200,
                                            "message": "FIGURE_UPDATE_SUCCESS",
                                            "content": updatedFigure
                                        };
                                        res.send(this.success_response);
                                    }
                                }); 
                            }else{
                                this.error_response = {
                                    "status": 401,
                                    "message": "NOT_AUTHORIZED"
                                };
                                res.json(this.error_response);
                            }
                        }).catch(err=>{
                            this.error_response = {
                                "status": 309,
                                "message":"QUERY_ERROR",
                                "content": err.message
                            };
                            res.send(this.error_response);
                        })
                    }else{
                        this.error_response = {
                            "status": 307,
                            "message":"QUERY_NOT_COMPLETE"
                        };
                        res.json(this.error_response);
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

}