import { Router } from "express";
import {
	createServiceController,
	deleteServiceController,
	getServiceController,
	listCompanyServicesController,
	listServicesController,
	updateServiceController,
} from "../controllers/service.controller.js";
import { authMiddleware, requireRoles } from "../middlewares/auth.middleware.js";

const router: Router = Router();

router.post(
	"/services",
	authMiddleware,
	requireRoles("COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	createServiceController,
);
router.get(
	"/services",
	authMiddleware,
	requireRoles("ADMIN", "SUPER_ADMIN"),
	listServicesController,
);
router.get("/companies/:companyId/services", listCompanyServicesController);
router.get("/services/:id", getServiceController);
router.patch(
	"/services/:id",
	authMiddleware,
	requireRoles("COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	updateServiceController,
);
router.delete(
	"/services/:id",
	authMiddleware,
	requireRoles("COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
	deleteServiceController,
);

export { router as serviceRouter };
