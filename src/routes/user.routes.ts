import { Router } from "express";
import {
  createUser,
  deleteUserController,
  getUserController,
  getUsersByCompanyController,
  listUsersController,
  searchUsersController,
  updateUserController,
} from "../controllers/user.controller";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware";

const router: Router = Router();

router.post("/users", optionalAuthMiddleware, createUser);
router.get("/users", authMiddleware, listUsersController);
router.get("/users/search", authMiddleware, searchUsersController);
router.get(
  "/users/company/:companyId",
  authMiddleware,
  getUsersByCompanyController,
);
router.get("/users/:id", authMiddleware, getUserController);
router.patch("/users/:id", authMiddleware, updateUserController);
router.delete("/users/:id", authMiddleware, deleteUserController);

export { router as userRouter };
