declare namespace type { 
    export type user = {
        email?:string;
        password?:string;
        firstname?:string;
        lastname?:string;
        updatedAt?: Date;
        token?:any;
        active?:boolean;
        role?:number;
    }

    export type userDataToken = {
        _id?:string;
        role?:number;
    }
}