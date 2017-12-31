import { Model } from "mongoose";
import { IUserModel } from "./user";
import { IFigureModel } from "./figure";
import { IStoryModel } from "./story";

export interface IModel {
  user: Model<IUserModel>;
  figure: Model<IFigureModel>;
  story: Model<IStoryModel>;
}