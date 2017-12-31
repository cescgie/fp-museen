import { Document } from "mongoose";
import { IStory } from "../interfaces/story";

export interface IStoryModel extends IStory, Document {
  //custom methods for your model would be defined here
}