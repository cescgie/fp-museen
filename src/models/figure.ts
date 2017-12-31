import { Document } from "mongoose";
import { IFigure } from "../interfaces/figure";

export interface IFigureModel extends IFigure, Document {
  //custom methods for your model would be defined here
}