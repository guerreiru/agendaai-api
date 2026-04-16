import { Router } from 'express';

import {
    getCurrentUserController, loginController, logoutController, refreshTokenController
} from '../controllers/auth.controller.js';
import { authOriginMiddleware } from '../middlewares/auth-origin.middleware.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';

const authRouter: Router = Router();

authRouter.post("/auth/login", loginController);
authRouter.post("/auth/refresh", authOriginMiddleware, refreshTokenController);
authRouter.post(
	"/auth/logout",
	authOriginMiddleware,
	optionalAuthMiddleware,
	logoutController,
);
authRouter.get("/auth/me", authMiddleware, getCurrentUserController);

export { authRouter };
