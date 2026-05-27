import { NextFunction, Request, Response } from "express";
import productModel from "../insurance-products/product.model";
import orderModel from "./order.model";
import { redisClient } from "../../config/redis";

const ORDER_CACHE_PREFIX = "insurance_order:";

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      productId,
      customerName,
      customerEmail,
      customerPhone,
      effectiveDate,
      note,
    } = req.body;

    const product = await productModel.findById(productId);

    if (!product || !product.isActive) {
      return res.status(401).json({
        success: false,
        message: "Sản phẩm không tồn tại hoặc đã hết hạn",
      });
    }

    const startDate = effectiveDate ? new Date(effectiveDate) : new Date();
    const expriredDate = addDays(startDate, product.durationDays);

    const order = await orderModel.create({
      user: req.user?.userId,
      product: product._id,
      customerName,
      customerEmail,
      customerPhone,
      effectiveDate: startDate,
      status: "PENDING",
      amount: product.price,
      expriredDate,
      note,
    });

    res.status(201).json({
      success: true,
      message: "Tạo đơn bảo hiểm thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orders = orderModel
      .find({ user: req.user?.userId })
      .populate("product", "name code price durationDays")
      .sort({ createAt: -1 })
      .lean();

    return res.status(201).json({
      success: true,
      data: orders,
      message: "Lấy danh sách đơn của tôi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.query;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    const orders = await orderModel
      .find(filter)
      .populate("user", "fullname email role")
      .populate("product", "name code price durationDays")
      .sort({ createAt: -1 })
      .lean();

    return res.status(201).json({
      success: true,
      data: orders,
      message: "Lấy danh sách đơn thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const cacheKey = `${ORDER_CACHE_PREFIX}${id}`;
    const cachedOrder = await redisClient.get(cacheKey);

    if (cachedOrder) {
      return res.status(201).json({
        success: true,
        data: JSON.parse(cachedOrder),
        message: "Lấy thông tin đơn thành công",
      });
    }

    const order = await orderModel
      .findById(id)
      .populate("user", "fullname email role")
      .populate("product", "name code price durationDays")
      .sort({ createAt: -1 })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: true,
        message: "Không có thông tin sản phẩm",
      });
    }

    if (
      req.user?.role === "USER" &&
      order.user._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: true,
        message: "Bạn không có quyền xem đơn này",
      });
    }

    await redisClient.set(cacheKey, JSON.stringify(order), { EX: 60 * 5 });

    return res.status(201).json({
      success: true,
      data: order,
      message: "Lấy chi tiết đơn thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatus = [
      "PENDING",
      "PAID",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(403).json({
        success: true,
        message: "Trạng thái đơn không hợp lệ",
      });
    }

    const order = await orderModel
      .findByIdAndUpdate(
        id,
        {
          status,
          ...(note !== undefined && { note }),
        },
        { new: true, runValidators: true },
      )
      .populate("user", "fullname email role")
      .populate("product", "name code price durationDays");

    if(!order) {
       return res.status(403).json({
        success: true,
        message: "Đơn không tồn tại",
      });
    }

    await redisClient.del(`${ORDER_CACHE_PREFIX}${id}`);

    const io = req.app.get("io");

    io.emit("order_status_updated", {
      orderId: order._id,
      status: order.status,
      message: `Đơn bảo hiểm đã được cập nhật sang trạng thái ${order.status}`,
    })

     return res.json({
      success: true,
      message: "Cập nhật trạng thái đơn thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMyOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {id} = req.params;

    const order = await orderModel.findById(id);
if(!order) {
       return res.status(403).json({
        success: true,
        message: "Đơn không tồn tại",
      });
    }

    if(order.user.toString() !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy đơn này",
      });
    }

    if(order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Chỉ được hủy đơn khi đang ở trạng thái PENDING",
      });
    }

    order.status = "CANCELLED";
    await order.save();

    await redisClient.del(`${ORDER_CACHE_PREFIX}${id}`);

    return res.json({
      success: true,
      message: "Hủy đơn thành công",
      data: order,
    });

  } catch (error) {
    next(error);
  }
};

