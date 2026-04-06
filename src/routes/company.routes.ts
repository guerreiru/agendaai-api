import { Router } from "express";
import {
  createCompanyController,
  deleteCompanyController,
  getCompanyController,
  getPublicCompanyBySlugController,
  listCompaniesController,
  searchPublicCompaniesController,
  updateCompanyController,
} from "../controllers/company.controller";
import { authMiddleware, requireRoles } from "../middlewares/auth.middleware";

const router: Router = Router();

router.post(
  "/companies",
  authMiddleware,
  requireRoles("COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
  createCompanyController,
);
router.get("/agendaai", searchPublicCompaniesController);
router.get("/agendaai/:slug", getPublicCompanyBySlugController);
router.get("/companies", listCompaniesController);
router.get("/companies/:id", getCompanyController);
router.patch(
  "/companies/:id",
  authMiddleware,
  requireRoles("COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
  updateCompanyController,
);
router.delete(
  "/companies/:id",
  authMiddleware,
  requireRoles("COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"),
  deleteCompanyController,
);

export { router as companyRouter };
