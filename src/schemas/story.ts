import { Schema } from "mongoose";

export var storySchema: Schema = new Schema({
    updatedAt: Date,
    createdAt: Date,
    updatedBy: String,
    createdBy: String,
    enabled: Boolean,
    description: String,
    mediaType: String,
    mediaRef: String,
});

storySchema.pre("save", function(next) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    if (!this.updatedAt) {
        this.updatedAt = new Date();
    }
    if (!this.enabled) {
        this.enabled = false;
    }
    next();
});