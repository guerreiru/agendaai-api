import type { Router as ExpressRouter } from "express";
import { Router } from "express";
import { slotController } from "../controllers/slot.controller";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";

export const slotRouter: ExpressRouter = Router();

// Get available slots for a professional to offer a service on a specific date
slotRouter.get(
  "/slots",
  optionalAuthMiddleware,
  slotController.getAvailableSlots.bind(slotController),
);
