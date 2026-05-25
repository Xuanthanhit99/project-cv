import express,{Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet'
import morgan from 'morgan';
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Insurance Order Management API",
  });
})

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

export default app;

