import mongoose, { Document, model, Schema } from "mongoose";

export interface IInsuranceProduct extends Document{
  name: string,
  code: string,
  description: string,
  price: number,
  durationDays: number,
  isActive: boolean
}


const insuranceProductSchema = new Schema<IInsuranceProduct>({
  name: {
    type: String,
    required: [true, "Tên sản phẩm bắt buộc"],
    trim: true
  },
  code: {
    type: String,
    required: [true, "Mã sản phẩm bắt buộc"],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    default: ""
  },
  price: {
    type: Number,
    min: 1,
    required: [true, "Giá sản phẩm bắt buộc"],
  },
  durationDays: {
    type: Number,
    min: 1,
    required: [true, "Thồi hạn sản phẩm bắt buộc"],
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {timestamps: true});

export default model<IInsuranceProduct>("insuranceProduct", insuranceProductSchema);
