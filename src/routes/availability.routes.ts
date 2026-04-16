import { Router } from 'express';

import {
    createAvailabilityController, createBulkAvailabilityController, deleteAvailabilityController,
    getAvailabilityController, listAvailabilitiesController,
    listProfessionalAvailabilitiesController, updateAvailabilityController
} from '../controllers/availability.controller.js';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware.js';

const router: Router = Router();

router.post(
	"/availabilities/batch",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	createBulkAvailabilityController,
);
router.post(
	"/availabilities",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	createAvailabilityController,
);
router.get(
	"/availabilities",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	listAvailabilitiesController,
);
router.get(
	"/professionals/:professionalId/availabilities",
	listProfessionalAvailabilitiesController,
);
router.get(
	"/availabilities/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	getAvailabilityController,
);
router.patch(
	"/availabilities/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	updateAvailabilityController,
);
router.delete(
	"/availabilities/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	deleteAvailabilityController,
);

export { router as availabilityRouter };
