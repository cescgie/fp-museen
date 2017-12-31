import { Model } from "mongoose";
import { IUserModel } from "./user";
import { IFigureModel } from "./figure";

export interface IModel {
  user: Model<IUserModel>;
  figure: Model<IFigureModel>;
}