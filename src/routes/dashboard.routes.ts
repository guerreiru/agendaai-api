import { Router } from 'express';

import {
    getCompanyDashboardController, getProfessionalMeDashboardController
} from '../controllers/dashboard.controller.js';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware.js';

const router: Router = Router();

router.get(
	"/companies/:companyId/dashboard",
	authMiddleware,
	requireRoles("COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	getCompanyDashboardController,
);

router.get(
	"/professionals/me/dashboard",
	authMiddleware,
	requireRoles("PROFESSIONAL"),
	getProfessionalMeDashboardController,
);

export { router as dashboardRouter };
