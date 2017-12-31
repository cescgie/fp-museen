/// <reference path="../../type.ts" />

import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "../../route";

import { IStory } from "../../../interfaces/story";
import { storySchema } from "../../../schemas/story";
import { IStoryModel } from '../../../models/story';

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
var Story: mongoose.Model<IStoryModel> = connection.model<IStoryModel>("Story", storySchema);

const passwordHash = require('password-hash');

import { Library } from "../../library";

const nJwt = require('njwt');
const secureRandom = require('secure-random');

import { ApiV1UserRoute } from "./user";

/**
 * / route
 * @class Story
 */
export class ApiV1StoryRoute extends BaseRoute {
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
     * @class ApiV1StoryRoute
     * @method create
     * @static
     */
    public static create(router: Router) {
        //log
        console.log("[ApiV1StoryRoute::create] Creating ApiV1StoryRoute route.");

        // Create story
        router.post("/api/v1/story", (req: Request, res: Response, next: NextFunction) => {
            new ApiV1StoryRoute().create(req, res);
        });

        // Get Story(s)
        router.get("/api/v1/story", (req: Request, res: Response) =>{
            new ApiV1StoryRoute().get(req, res);
        });

         // Update Story
         router.put("/api/v1/story", (req: Request, res: Response) =>{
            new ApiV1StoryRoute().update(req, res);
        });

        // Delete Story
        router.delete("/api/v1/story", (req: Request, res: Response) =>{
            new ApiV1StoryRoute().delete(req, res);
        });
    }

    /**
     * Method to create story.
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
                    let figureId:string = req.body.figureId;
                    let parentId:string = req.body.parentId;

                    // Check if mandatory values exist
                    if( 
                        name && name !==null &&
                        description && description !==null &&
                        parentId && parentId !== null &&
                        figureId && figureId !== null
                    ){
                        let story_data:IStory = {
                            description:description,
                            createdBy:userID,
                            updatedBy:userID,
                            parentId:parentId,
                            figureId:figureId                                       
                        };

                        /**
                         * TODO!
                         * Read available uploaded image by path+userID+-story
                         * If exists, get filedir then rename file to path+userID+respCreateStory.id
                         */
                        this.createStory(story_data, userID).then(respCreateStory=>{
                            res.send(respCreateStory);
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
     * Method to get story(s) 
     * JWT Authorization needed.
     * 
     * @param req HEADER: JWT Token(!). QUERY: createdBy, storyId
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
                    let createdBy:string = req.query.createdBy;
                    let storyId:number = req.query.storyId;

                    let QUERY:any = {};

                    // Check if mandatory values exist
                    if(storyId && storyId!==null){
                        if(createdBy && createdBy!==null){
                            QUERY = {
                                _id:storyId,
                                createdBy:createdBy                                
                            }
                        }else{
                            QUERY = {
                                _id:storyId
                            }
                        }
                    }
                    
                    this.populateStory(QUERY).then((response:any)=>{
                        res.send(response);                            
                    }).catch((err)=>{
                        res.json(err);
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
     * Method to delete story.
     * JWT Authorization needed.
     * 
     * @param req HEADER: JWTtoken(!). QUERY: storyId, createdBy(!). 
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
                    let storyId:number = req.query.storyId;

                    let QUERY:any = {};

                    // Check if mandatory values exist
                    if(storyId && storyId!==null){
                        if(createdBy && createdBy!==null){
                            QUERY = {
                                _id:storyId,
                                createdBy:createdBy                                
                            }
                        }else{
                            QUERY = {
                                _id:storyId
                            }
                        }

                        /**
                         * Delete permission roles: admin, admin, createdBy
                         */
                        this.populateStory(QUERY).then((response:any)=>{
                            if(response.status !== 200){
                                res.json(response);
                            }else{
                                let storyContent: any = response.content[0];
                                if(userRole == 1 || userRole == 2 || storyContent.createdBy == userID){
                                    Story.findOne(QUERY).remove().exec((err, data)=>{
                                        if(err){
                                            this.error_response = {
                                                "status": 402,
                                                "message":"DATABASE_ERROR"
                                            };
                                            res.json(this.error_response);
                                        }else{
                                            this.success_response = {
                                                "status": 200,
                                                "message": "STORY_DELETE_SUCCESS"
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

    /**
     * create new story(!)
     */
    createStory(storyData:IStory, userID:string):Promise<any>{
        return new Promise((resolve,reject)=>{
            //save storyData to DB
            let story_model = new Story(storyData)
            story_model.save((err, createdStory)=>{
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
                        "message": "STORY_CREATE_SUCCESS",
                        "content": createdStory
                    };
                    resolve(this.success_response);
                }
            });
        });
    }

    /**
     * Populate Story
     * @param QUERY 
     */
    populateStory(QUERY?:any):Promise<any>{
        return new Promise((resolve,reject)=>{
            if(Object.keys(QUERY).length !== 0){
                Story.find(QUERY, null , {sort:{createdAt:-1}}, (err, story)=> {
                    if(err){
                        this.error_response = {
                            "status": 309,
                            "message":"QUERY_ERROR",
                            "content": err.message
                        };
                        reject(this.error_response);
                    }else if(!story || story === null || story.length < 1){
                        this.error_response = {
                            "status": 331,
                            "message":"NO_STORY_FOUND"
                        };
                        reject(this.error_response);
                    }else{
                        this.success_response = {
                            status:200,
                            message:'STORY_READ_SUCCESS',
                            content: story
                        }
                        resolve(this.success_response)
                    }
                })
            }else{
                Story.find({}, null , {sort:{createdAt:-1}},(err, story)=> {
                    if(err){
                        this.error_response = {
                            "status": 309,
                            "message":"QUERY_ERROR",
                            "content": err.message
                        };
                        reject(this.error_response);
                    }else if(!story || story === null || story.length < 1){
                        this.error_response = {
                            "status": 331,
                            "message":"NO_STORY_FOUND"
                        };
                        reject(this.error_response);
                    }else{
                        this.success_response = {
                            status:200,
                            message:'STORY_READ_SUCCESS',
                            content: story
                        }
                        resolve(this.success_response)
                    }
                });
            }
        });
    }

    /**
     * Method to update story.
     * JWT Authorization needed.
     * _id, createdBy, createdAt are not allowed to be updated
     * 
     * @param req HEADER: JWTtoken(!). QUERY: storyId(!). BODY: {dinamic properties}. 
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
                    let storyId:string = req.query.storyId;
                    
                    // Check if mandatory values exist
                    if( storyId ){
                        this.populateStory({_id:storyId}).then(respPopulateStory=>{
                            let storyContent = respPopulateStory.content[0];

                            /**
                             * #RolePermission
                             * Check role permission
                             * Permission role: Admin, Master, createdBy
                            */
                            if(userRole == 1 || userRole == 2 || storyContent.createdBy == userID ){
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
                                   
                                // Update story
                                storyContent.set(data_toUpdate);
                                storyContent.save((err, updatedStory)=> {
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
                                            "message": "STORY_UPDATE_SUCCESS",
                                            "content": updatedStory
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