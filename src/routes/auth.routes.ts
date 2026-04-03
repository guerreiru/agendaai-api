import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  loginController,
  refreshTokenController,
  getCurrentUserController,
  logoutController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter: Router = Router();

authRouter.post("/auth/login", loginController);
authRouter.post("/auth/refresh", refreshTokenController);
authRouter.post("/auth/logout", logoutController);
authRouter.get("/auth/me", authMiddleware, getCurrentUserController);

export { authRouter };
