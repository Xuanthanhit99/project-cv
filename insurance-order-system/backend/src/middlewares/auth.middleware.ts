import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authheader = req.headers.authorization;

    if(!authheader || !authheader.startsWith("Bearer ")){
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }

    const token = authheader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    req.user = decoded;

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}