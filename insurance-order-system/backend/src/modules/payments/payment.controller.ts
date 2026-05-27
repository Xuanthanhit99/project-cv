import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Payment from "./payment.model";
import InsuranceOrder from "../insurance-orders/order.model";
import { redisClient } from "../../config/redis";

const ORDER_CACHE_PREFIX = "insurance_order:";

const generateTransactionCode = () => {
  return `PAY_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
};

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "orderId không hợp lệ",
      });
    }

    const order = await InsuranceOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn bảo hiểm",
      });
    }

    if (order.user.toString() !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thanh toán đơn này",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể thanh toán đơn ở trạng thái PENDING",
      });
    }

    const existedPendingPayment = await Payment.findOne({
      order: order._id,
      status: "PENDING",
    });

    if (existedPendingPayment) {
      return res.status(200).json({
        success: true,
        message: "Đơn đã có giao dịch thanh toán đang chờ xử lý",
        data: {
          payment: existedPendingPayment,
          mockPaymentUrl: `/api/payments/mock-callback?transactionCode=${existedPendingPayment.transactionCode}&status=SUCCESS`,
        },
      });
    }

    const payment = await Payment.create({
      order: order._id,
      user: req.user.userId,
      amount: order.amount,
      transactionCode: generateTransactionCode(),
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Tạo giao dịch thanh toán thành công",
      data: {
        payment,
        mockPaymentUrl: `/api/payments/mock-callback?transactionCode=${payment.transactionCode}&status=SUCCESS`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const mockPaymentCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionCode, status } = req.query;

    if (!transactionCode || !status) {
      return res.status(400).json({
        success: false,
        message: "Thiếu transactionCode hoặc status",
      });
    }

    if (!["SUCCESS", "FAILED"].includes(status as string)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái thanh toán không hợp lệ",
      });
    }

    const payment = await Payment.findOne({
      transactionCode,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch thanh toán",
      });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Giao dịch đã được xử lý trước đó",
      });
    }

    payment.status = status as "SUCCESS" | "FAILED";

    if (status === "SUCCESS") {
      payment.paidAt = new Date();
    }

    await payment.save();

    const order = await InsuranceOrder.findById(payment.order);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn bảo hiểm",
      });
    }

    if (payment.status === "SUCCESS") {
      order.status = "PAID";
      await order.save();
    }

    await redisClient.del(`${ORDER_CACHE_PREFIX}${order._id.toString()}`);

    const io = req.app.get("io");

    io.emit("payment_updated", {
      orderId: order._id,
      transactionCode: payment.transactionCode,
      paymentStatus: payment.status,
      orderStatus: order.status,
      message:
        payment.status === "SUCCESS"
          ? "Thanh toán thành công"
          : "Thanh toán thất bại",
    });

    return res.json({
      success: true,
      message:
        payment.status === "SUCCESS"
          ? "Thanh toán thành công"
          : "Thanh toán thất bại",
      data: {
        payment,
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payments = await Payment.find({
      user: req.user?.userId,
    })
      .populate("order")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      message: "Lấy lịch sử thanh toán thành công",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payments = await Payment.find()
      .populate("user", "fullname email role")
      .populate("order")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      message: "Lấy toàn bộ lịch sử thanh toán thành công",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};