import { model, Schema, Types } from "mongoose";
import userModel from "../users/user.model";

export type OrderStatus = "PENDING" | "PAID" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface IInsuranceOrder extends Document {
  user: Types.ObjectId,
  product: Types.ObjectId,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  amount: number,
  status: OrderStatus,
  effectiveDate: Date,
  expriredDate: Date,
  note?: string
}


const InsuranceOrderSchema = new Schema<IInsuranceOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "InsuranceProduct",
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ["PENDING","PAID","APPROVED", "REJECTED" ,"CANCELLED"],
    default: "PENDING"
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expriredDate: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    default: ""
  }
}, {timestamps: true});

export default model<IInsuranceOrder>("InsuranceOrder", InsuranceOrderSchema)