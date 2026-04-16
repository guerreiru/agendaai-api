import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as companyRepository from '../../src/repositories/company.repository';
import * as dashboardRepository from '../../src/repositories/dashboard.repository';
import * as userRepository from '../../src/repositories/user.repository';
import {
    getCompanyDashboard, getProfessionalMeDashboard
} from '../../src/services/dashboard.service';
import { AppError } from '../../src/utils/app-error';

vi.mock("../../src/repositories/company.repository");
vi.mock("../../src/repositories/dashboard.repository");
vi.mock("../../src/repositories/user.repository");

describe("dashboard.service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns company dashboard for company owner", async () => {
		vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
			id: "c-1",
			ownerId: "owner-1",
			timezone: "America/Sao_Paulo",
		} as never);
		vi.mocked(dashboardRepository.getCompanyDashboardSummary).mockResolvedValue({
			companyId: "c-1",
			serviceCount: 10,
			professionalCount: 4,
			todayAppointmentsCount: 8,
			monthRevenue: 1200,
			nextAppointments: [],
		} as never);

		const result = await getCompanyDashboard("c-1", {
			actorId: "owner-1",
			actorRole: "COMPANY_OWNER",
		});

		expect(result.companyId).toBe("c-1");
		expect(dashboardRepository.getCompanyDashboardSummary).toHaveBeenCalledWith(
			"c-1",
			"America/Sao_Paulo",
		);
	});

	it("rejects company dashboard for owner of another company", async () => {
		vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
			id: "c-1",
			ownerId: "owner-1",
			timezone: "UTC",
		} as never);

		await expect(
			getCompanyDashboard("c-1", {
				actorId: "owner-2",
				actorRole: "COMPANY_OWNER",
			}),
		).rejects.toBeInstanceOf(AppError);
	});

	it("returns professional me dashboard", async () => {
		vi.mocked(userRepository.findUserById).mockResolvedValue({
			id: "p-1",
			role: "PROFESSIONAL",
			companyId: "c-1",
		} as never);
		vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
			id: "c-1",
			timezone: "America/Sao_Paulo",
		} as never);
		vi.mocked(
			dashboardRepository.getProfessionalDashboardSummary,
		).mockResolvedValue({
			professionalId: "p-1",
			activeServiceCount: 3,
			todayAppointmentsCount: 5,
			monthRevenue: 850,
			nextAppointments: [],
		} as never);

		const result = await getProfessionalMeDashboard({
			actorId: "p-1",
			actorRole: "PROFESSIONAL",
		});

		expect(result.professionalId).toBe("p-1");
		expect(
			dashboardRepository.getProfessionalDashboardSummary,
		).toHaveBeenCalledWith("p-1", "America/Sao_Paulo");
	});

	it("rejects professional me dashboard when actor is not professional", async () => {
		await expect(
			getProfessionalMeDashboard({
				actorId: "u-1",
				actorRole: "CLIENT",
			}),
		).rejects.toBeInstanceOf(AppError);
	});
});
