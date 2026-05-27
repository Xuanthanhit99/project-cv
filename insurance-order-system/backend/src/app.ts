import express,{Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet'
import morgan from 'morgan';
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import productRoutes from "./modules/insurance-products/product.routes";
import cookieParser from 'cookie-parser';
import orderRoutes from "./modules/insurance-orders/order.routes";
import paymentRoutes from "./modules/payments/payment.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:5000",
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser())

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Insurance Order Management API",
  });
})

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/insurance-products", productRoutes);
app.use("/api/insurance-orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

export default app;

