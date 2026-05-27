import { NextFunction, Request, Response } from "express";
import InsuranceProduct from "./product.model";
import { redisClient } from "../../config/redis";

const PRODUCT_LIST_CACHE_KEY = "insurance_products:list";

export const createproduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {name, code, description, price, durationDays} = req.body;

    const existedProduct = await InsuranceProduct.findOne({code});

    if(existedProduct) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm này đã tồn tại!"
      })
    }

    const product = await InsuranceProduct.create({
      name, code, description, price, durationDays
    })

    await redisClient.del(PRODUCT_LIST_CACHE_KEY);

    return res.status(201).json({
      success: true,
      data: product,
      message: "Tạo sản phẩm thành công."
    })
  } catch (err) {
    next(err)
  }
}

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cachedProducts = await redisClient.get(PRODUCT_LIST_CACHE_KEY);

      if(cachedProducts) {
        return res.status(201).json({
          success: true,
          message: "Lấy danh sách thành công",
          data: JSON.parse(cachedProducts)
        })
      }

      const products = await InsuranceProduct.find().sort({createAt: -1}).lean();

      await redisClient.set(PRODUCT_LIST_CACHE_KEY,JSON.stringify(products),{
        EX: 60 * 5
      })

      return res.status(201).json({
          success: true,
          message: "Lấy danh sách thành công",
          data: products
      })

    } catch (error) {
      next(error)
    }
}

export const getProductId = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const {id} = req.params;


      const cachedKey = `insurance_products:${id}`;

      const cachedProduct = await redisClient.get(cachedKey)

      if(cachedProduct) {
        return res.status(201).json({
          success: true,
          message: "Lấy sản phẩm thành công",
          data: JSON.parse(cachedProduct)
        })
      }

      const product = await InsuranceProduct.findById(id).lean();

      if(!product) {
        return res.status(401).json({
          success: false,
          message: "Không có thông tin sản phẩm"
        })
      }

      await redisClient.set(cachedKey,JSON.stringify(product),{
        EX: 60 * 5
      })

      return res.status(201).json({
          success: true,
          message: "Lấy danh sách thành công",
          data: product
      })

    } catch (error) {
      next(error)
    }
}

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const {id} = req.params;
      
      const updateProduct = await InsuranceProduct.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      })

      if(!updateProduct) {
        return res.status(401).json({
          success: false,
          message: "Không có thông tin sản phẩm"
        })
      }

      await redisClient.del(PRODUCT_LIST_CACHE_KEY);
      await redisClient.del(`insurance_products:${id}`);

      return res.status(201).json({
          success: true,
          message: "Cập nhập sản phẩm thành công",
          data: updateProduct
      })

    } catch (error) {
      next(error)
    }
}

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const {id} = req.params;
      
      const updateProduct = await InsuranceProduct.findByIdAndDelete(id);

      if(!updateProduct) {
        return res.status(401).json({
          success: false,
          message: "Không có thông tin sản phẩm"
        })
      }

      await redisClient.del(PRODUCT_LIST_CACHE_KEY);
      await redisClient.del(`insurance_products:${id}`);

      return res.status(201).json({
          success: true,
          message: "Xóa sản phẩm thành công",
      })

    } catch (error) {
      next(error)
    }
}