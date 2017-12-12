import { Schema } from "mongoose";

export var userSchema: Schema = new Schema({
  createdAt: Date,
  username: String,
  email: String,
  password: String,
  firstname: String,
  lastname: String,
  updatedAt: Date,
  active: Boolean,
  token: String,
  role: Number,
});

userSchema.pre("save", function(next) {
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  if (!this.active) {
    this.active = false;
  }
  /**
   * Role:
   * 1. Master
   * 2. Admin
   * 3. User
   */
  if (!this.role) {
    this.role = 3;
  }
  next();
});