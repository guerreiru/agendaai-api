import { Router } from 'express';

import {
    createProfessionalServiceController, deleteProfessionalServiceController,
    getProfessionalServiceController, listCompanyProfessionalServicesController,
    listProfessionalServicesController, updateProfessionalServiceController
} from '../controllers/professional-service.controller.js';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware.js';

const router: Router = Router();

router.post(
	"/professional-services",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	createProfessionalServiceController,
);
router.get(
	"/professional-services",
	authMiddleware,
	requireRoles("ADMIN", "SUPER_ADMIN"),
	listProfessionalServicesController,
);
router.get(
	"/companies/:companyId/professional-services",
	listCompanyProfessionalServicesController,
);
router.get("/professional-services/:id", getProfessionalServiceController);
router.patch(
	"/professional-services/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	updateProfessionalServiceController,
);
router.delete(
	"/professional-services/:id",
	authMiddleware,
	requireRoles("PROFESSIONAL", "COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	deleteProfessionalServiceController,
);

export { router as professionalServiceRouter };
