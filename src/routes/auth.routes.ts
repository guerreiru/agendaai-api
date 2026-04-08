import { Router } from "express";
import {
	getCurrentUserController,
	loginController,
	logoutController,
	refreshTokenController,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter: Router = Router();

authRouter.post("/auth/login", loginController);
authRouter.post("/auth/refresh", refreshTokenController);
authRouter.post("/auth/logout", logoutController);
authRouter.get("/auth/me", authMiddleware, getCurrentUserController);

export { authRouter };
