import { Request, Response } from "express";
import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "ADMIN" | "STAFF" | "USER"

export interface Iuser extends Document{
  fullname: string,
  email: string,
  password: string,
  role: UserRole,
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<Iuser>({
  fullname: {
    type: String,
    trim: true,
    required: [true, "Bắt buộc phải truyền FullName"]
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: [true, "Bắt buộc phải truyền Email"]
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ["ADMIN","STAFF","USER"],
    default: "USER",
  }
}, {timestamps: true});

userSchema.pre('save', async function () {
  if(!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.comparePassword = async function(candidatePassword: string):Promise<boolean> {
  return bcrypt.compare(candidatePassword,this.password)
}

export default mongoose.model<Iuser>("User", userSchema);