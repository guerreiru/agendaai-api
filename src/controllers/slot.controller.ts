import type { Request, Response, NextFunction } from "express";
import { slotService } from "../services/slot.service";
import { validateGetSlotsParams } from "../validators/schedule-exception";
import { AppError } from "../utils/app-error";

export class SlotController {
  async getAvailableSlots(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = validateGetSlotsParams(req.query);

      const slots = await slotService.getAvailableSlots(
        params.professionalId,
        params.serviceId,
        params.date,
      );

      res.status(200).json(slots);
    } catch (error) {
      next(error);
    }
  }
}

export const slotController = new SlotController();
