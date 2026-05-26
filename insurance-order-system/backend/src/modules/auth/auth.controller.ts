import { NextFunction, Request, Response } from "express";
import userModel from "../users/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { redisClient } from "../../config/redis";
import bcrypt from "bcryptjs";
import { sendMail } from "../../utils/mail/sendMail";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fullname, email, password, role } = req.body;

    await sendMail({to: email, cc: email, otp: email});
    
    const existedUser = await userModel.findOne({ email });

    if (existedUser) {
      return res.status(400).json({
        success: false,
        message: "Email này đã tồn tại!",
      });
    }

    const user = await userModel.create({
      fullname,
      password,
      email,
      role: role || "USER",
    });

    return res.status(200).json({
      success: true,
      messaage: "Đăng ký thành công",
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email chưa tồn tại",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không chính xác",
      });
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await redisClient.set(`refresh_token:${user._id.toString()}`, refreshToken, {
      EX: 7 * 24 * 60 * 60,
    });

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token bắt buộc",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const storedToken = await redisClient.get(
      `refresh_token:${decoded.userId}`,
    );

    if (!storedToken || storedToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const user = await userModel.findById(decoded.userId);

    
    if (!user) {
      await redisClient.del(`refresh_token:${decoded.userId}`);

      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return res.json({
      success: true,
      message: "Refresh token thành công",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Refresh token không hợp lệ hoặc đã hết hạn",
    });
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      return res.json({
        success: true,
        message: "Đăng xuất thành công",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    await redisClient.del(`refresh_token:${decoded?.userId}`);
    
    return res.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
      return res.status(400).json({
        success: false,
        message: "Email và fullname chưa có thông tin",
      });
    }
  
    const existedUser = await userModel.findOne({ email });

    if (!existedUser) {
      return res.status(400).json({
        success: false,
        message: "Email này chưa đăng kí!",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashOTP = await bcrypt.hash(otp, 10);

    await userModel.findByIdAndUpdate({id: existedUser._id}, {password: hashOTP});

    await redisClient.set(`reset_password:${existedUser._id}`, hashOTP, {EX: 5 * 60})

    
    return res.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};
