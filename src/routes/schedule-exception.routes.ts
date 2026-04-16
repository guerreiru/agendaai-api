import type { Router as ExpressRouter } from "express";
import { Router } from 'express';

import { scheduleExceptionController } from '../controllers/schedule-exception.controller.js';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware.js';

export const scheduleExceptionRouter: ExpressRouter = Router();

// Create schedule exception
scheduleExceptionRouter.post(
	"/professionals/:professionalId/schedule-exceptions",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	scheduleExceptionController.createException.bind(scheduleExceptionController),
);

// Get all exceptions for a professional
scheduleExceptionRouter.get(
	"/professionals/:professionalId/schedule-exceptions",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	scheduleExceptionController.getExceptionsByProfessional.bind(
		scheduleExceptionController,
	),
);

// Get specific exception
scheduleExceptionRouter.get(
	"/schedule-exceptions/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	scheduleExceptionController.getException.bind(scheduleExceptionController),
);

// Update exception
scheduleExceptionRouter.patch(
	"/professionals/:professionalId/schedule-exceptions/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	scheduleExceptionController.updateException.bind(scheduleExceptionController),
);

// Delete exception
scheduleExceptionRouter.delete(
	"/professionals/:professionalId/schedule-exceptions/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	scheduleExceptionController.deleteException.bind(scheduleExceptionController),
);
