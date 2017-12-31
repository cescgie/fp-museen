export interface IStory {
    createdAt?:any;
    createdBy?:string;    
    updatedAt?:any;    
    updatedBy?:string;
    parentId?:string;
    figureId?:string;
    enabled?:boolean;
    content?:string;
    mediaType?:string;
    mediaRef?:string;
}