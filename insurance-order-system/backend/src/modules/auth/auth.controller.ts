import { NextFunction,Request,Response } from "express";
import userModel from "../users/user.model";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {fullname, email, password, role} = req.body;

    const existedUser = await userModel.findOne({email});

    if(existedUser) {
      return res.status(400).json({
        success: false,
        message: "Email này đã tồn tại!"
      })
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      fullname,
      password: hashPassword,
      email,
      role: role || "USER"
    })

    return res.status(200).json({
      success: true,
      messaage: "Đăng ký thành công",
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {email, password} = req.body;

    const user = await userModel.findOne({email});

    if(!user) {
      return res.status(401).json({
        success: false,
        message: "Email chưa tồn tại"
      })
    }

    const isMatch = await bcrypt.compare(password, user.password as string);

    if(!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không chính xác"
      })
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

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
          role: user.role
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {refreshToken} = req.body;

    if(!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token bắt buộc"
      })
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await userModel.findById(decoded.userId);

    if(!user || user.refreshToken != refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token không thành công"
      })
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role
    })

    return res.json({
      success: true,
      message: "Refresh token thành công",
      data: {
        accessToken: newAccessToken
      }
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {refreshToken} = req.body;

    if(refreshToken) {
      await userModel.findOneAndUpdate(
        {refreshToken},
        {
          refreshToken: null
        }
      )
    }

    return res.json({
      success: true,
      message: "Đăng xuất thành công"
    })
  } catch (error) {
    next(error)
  }
}