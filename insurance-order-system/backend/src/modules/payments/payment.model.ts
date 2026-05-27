import { number } from "joi";
import { Document, model, Schema, Types } from "mongoose";

export type PaymentStatus =  "PENDING" | "SUCCESS" | "FAILED";

export interface IIPayment extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  transactionCode: string;
  provider: string;
  status: PaymentStatus;
  paidAt?: Date;
}

const paymentSchema = new Schema<IIPayment>({
  order: {
    type: Schema.Types.ObjectId,
    ref: "InsuranceOrder",
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transactionCode: {
    type: String,
    required: true,
    unique: true
  },
  provider: {
    type: String,
    default: "MOCK_PAYMENT"
  },
  status: {
    type: String,
    enum: ["PENDING" , "SUCCESS" , "FAILED"],
    default: "PENDING"
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {timestamps: true});

export default model<IIPayment>("Payment", paymentSchema);