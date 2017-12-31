import { Schema } from "mongoose";

export var figureSchema: Schema = new Schema({
    updatedAt: Date,
    createdAt: Date,
    updatedBy: String,
    createdBy: String,
    name: String,
    enabled: Boolean,
    description: String,
    mediaType: String,
    mediaRef: String,
});

figureSchema.pre("save", function(next) {
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