import mongoose, { Document } from "mongoose";

export type UserRole = "ADMIN" | "STAFF" | "USER"

export interface Iuser extends Document{
  fullname: String,
  email: String,
  password: String,
  role: UserRole,
  refreshToken: String
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
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["ADMIN","STAFF","USER"],
    default: "USER",
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {timestamps: true});

export default mongoose.model<Iuser>("User", userSchema);