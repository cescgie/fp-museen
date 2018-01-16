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
import { ObjectId } from "bson";

import imageType = require('image-type');
import fs = require('fs');
const rimraf = require('rimraf');

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

    private mediaFolder: any = ['image','video','dimage'];
    
    imageDir:string = process.env.ASSETS_IMAGE_DIR+'/story/'

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

        // Post new image
        router.post("/api/v1/story/image", (req: Request, res: Response) => {
            new ApiV1StoryRoute().postImage(req, res);
        });

        // Get all medias by reference in folder
        router.get("/api/v1/story/media", (req: Request, res: Response) => {
            new ApiV1StoryRoute().getMedia(req, res);
        });
    }

    /**
     * Method to post figure image 
     * JWT Authorization needed.
     * 
     * @param req HEADER: JWT Token(!) 
     * @param res {status,message,content}
     */
    public getMedia(req: Request, res: Response) {
        if (req.headers['authorization'] && req.headers['authorization'] !== null) {
            let headerAuth: any = req.headers['authorization'];
            let campaignId: any = req.headers['campaignid'];

            this._apiV1UserRoute.verifyJWT(headerAuth).then((jwt) => {
                if (!jwt) {
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.status(this.error_response.status).json(this.error_response);
                } else {
                    // JWT BODY
                    let userID = jwt.body.sub;
                    let userRole = jwt.body.permissions;
                    // HEADER QUERY
                    let storyId:number = req.query.storyId;

                    let folders: any = this.mediaFolder;
                    let read = (dir) =>
                    fs.readdirSync(dir)
                        .reduce((files, file) =>
                            files.concat(file),
                        []);

                    let readFolder: any = {};
                    folders.forEach(element => {
                        readFolder[element] = []
                        let mediaFolder = this.imageDir + storyId
                        let elementFolder = mediaFolder + '/' + element
                        if (fs.existsSync(elementFolder)) {
                            readFolder[element] = read(elementFolder)
                        }
                    });

                    this.success_response = {
                        "status": 200,
                        "message": "READ_MEDIA_SUCCESS",
                        "content": readFolder
                    };

                    res.send(this.success_response);
                }
            }).catch((err) => {
                this.error_response = {
                    "status": 406,
                    "message": 'SIGNATURE_VERIFICATION_FAILED'
                };
                res.status(this.error_response.status).json(this.error_response);
            })
        } else {
            this.error_response = {
                "status": 401,
                "message": "NOT_AUTHORIZED"
            };
            res.status(this.error_response.status).json(this.error_response);
        }
    }

     /**
     * Method to post story image 
     * JWT Authorization needed.
     * 
     * @param req HEADER: JWT Token(!) 
     * @param res {status,message,content}
     */
    public postImage(req: Request, res: Response) {

        if (req.headers['authorization'] && req.headers['authorization'] !== null) {
            let headerAuth: any = req.headers['authorization'];
            let campaignId: any = req.headers['campaignid'];

            this._apiV1UserRoute.verifyJWT(headerAuth).then((jwt) => {
                if (!jwt) {
                    this.error_response = {
                        "status": 403,
                        "message": "NOT_AUTHORIZED"
                    };
                    res.status(this.error_response.status).json(this.error_response);
                } else {
                    // JWT BODY
                    let userID = jwt.body.sub;
                    let userRole = jwt.body.permissions;
                    // SAVE FILE
                    this.saveFile(req, res, 0, 15 * 1024 * 1024, userID).then(response => {
                        res.json(this.success_response);
                    }).catch(err => {
                        res.send(err);
                    })

                }
            }).catch((err) => {
                this.error_response = {
                    "status": 406,
                    "message": 'SIGNATURE_VERIFICATION_FAILED'
                };
                res.status(this.error_response.status).json(this.error_response);
            })
        } else {
            this.error_response = {
                "status": 401,
                "message": "NOT_AUTHORIZED"
            };
            res.status(this.error_response.status).json(this.error_response);
        }

    }

    private authenticateBuffer(buffer) {
        var type = imageType(buffer),
            ret = false;
        if (type) {
            ret = true;
        }
        return ret;
    }

    private saveFile(req: any, res: Response, minsize, maxsize, userID) {
        return new Promise((resolve, reject) => {
            req.file = {};
            req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                if (!filename) {
                    this.error_response = {
                        "status": 314,
                        "message": "ERROR_NO_FILE"
                    };
                    reject(this.error_response);
                }

                file.fileRead = [];

                file.on('limit', function() {
                    this.error_response = {
                        "status": 314,
                        "message": "ERROR_FILE_TOO_BIG"
                    };
                    reject(this.error_response);
                });

                file.on('data', function(chunk) {
                    this.fileRead.push(chunk);
                });

                file.on('error', function(err) {
                    this.error_response = {
                        "status": 314,
                        "message": "ERROR_READING_FILE"
                    };
                    reject(this.error_response);
                });

                file.on('end', function() {
                    var finalBuffer = Buffer.concat(this.fileRead);
                    var length = finalBuffer.length;
                    if (length > maxsize) {
                        this.error_response = {
                            "status": 314,
                            "message": "ERROR_FILE_TOO_BIG"
                        };
                        reject(this.error_response);
                        return;
                    }
                    if (length < minsize) {
                        this.error_response = {
                            "status": 314,
                            "message": "ERROR_FILE_TOO_SMALL"
                        };
                        reject(this.error_response);
                        return;
                    }
                    req.file["image"] = {
                        buffer: finalBuffer,
                        size: finalBuffer.length,
                        filename: filename,
                        mimetype: mimetype
                    };
                });

            });

            req.busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
                req.file[fieldname] = val;
            });

            req.busboy.on('finish', (key, value) => {
                if (!this.authenticateBuffer(req.file["image"].buffer)) {
                    this.error_response = {
                        "status": 314,
                        "message": "ERROR_UNDEFINED_FILE"
                    };
                    reject(this.error_response);
                }

                let newUserFolder = this.imageDir + userID 
                if (!fs.existsSync(newUserFolder)){
                    fs.mkdirSync(newUserFolder);
                }
                let newImageFolder = newUserFolder +'/image'
                if (!fs.existsSync(newImageFolder)){
                    fs.mkdirSync(newImageFolder);
                }

                let filedir = newImageFolder + '/' + req.file["image"].filename;

                fs.writeFile(filedir, req.file.image.buffer, (err) => {
                    this.success_response = {
                        "status": 200,
                        "message": "UPLOAD_FIGURE_IMAGE_SUCCESS"
                    };
                    resolve(this.success_response);
                });
            });

            req.pipe(req.busboy);

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
                    let content:string = req.body.content;
                    let figureId:string = req.body.figureId;
                    let parentId:string = req.body.parentId;

                    // Check if mandatory values exist
                    if( 
                        content && content !==null &&
                        figureId && figureId !== null
                    ){
                        let story_data:IStory = {
                            content:content,
                            createdBy:userID,
                            updatedBy:userID,
                            parentId:parentId,
                            figureId:figureId                                       
                        };

                        /**
                         * TODO
                         * - Other medias
                         * Read available uploaded image by path+userID+
                         * If exists, get filedir then rename file to path+userID+respCreateStory.id
                         */
                        let folderPath = this.imageDir + userID

                        if (fs.existsSync(folderPath)) {
                            this.createStory(story_data, userID).then(respCreateStory=>{

                                let newFolderDir = this.imageDir + respCreateStory.content._id 
                                
                                if (!fs.existsSync(newFolderDir)){
                                    fs.mkdirSync(newFolderDir);
                                }

                                fs.rename(folderPath, newFolderDir, (err) => {
                                    if (err) {
                                        this.error_response = {
                                            "status": 309,
                                            "message": "RENAME_FOLDER_ERROR",
                                            "content": err.message
                                        };
                                        res.json(this.error_response);
                                    }else{
                                        res.send(respCreateStory);
                                    }
                                });
                            }).catch(err=>{
                                res.send(err);
                            })
                        }else{
                            this.error_response = {
                                "status": 307,
                                "message": "NO_IMAGE_UPLOADED"
                            };
                            res.json(this.error_response);
                        }

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
     * @param req HEADER: JWT Token(!). QUERY: createdBy, storyId, figureId, createdBy, createdAt, enabled
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
                    this.getStory(req_query).then(respGetStory=>{
                        res.send(respGetStory);
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

    getStory(param:any):Promise<any>{
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
                MATCH['figureId'] = param.figureId
            }

            if(param.storyId && param.storyId !== 'null' && param.storyId !== undefined){
                let id = param.storyId
                MATCH['_id'] =  new ObjectId(id)
            }

            if(param.enabled && param.enabled !== 'null' && param.enabled !== undefined){
                MATCH['enabled'] = JSON.parse(param.enabled)
            }

            QUERY = [
                { $match: MATCH },
            ];

            this.populateStoryQuery(QUERY).then((response)=>{
                resolve(response);
            }).catch(err=>{
                reject(err);
            }) 
        })
    }

    populateStoryQuery(QUERY:any):Promise<any>{
        return new Promise((resolve,reject)=>{
            Story.aggregate(
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