import type { UserRole } from "./user.js";

export type AppointmentStatus =
	| "SCHEDULED"
	| "PENDING_CLIENT_CONFIRMATION"
	| "PENDING_PROFESSIONAL_CONFIRMATION"
	| "CONFIRMED"
	| "CANCELLED"
	| "COMPLETED"
	| "NO_SHOW"
	| "REJECTED";

export type CreateAppointmentInput = {
	companyId: string;
	clientId: string;
	professionalId: string;
	serviceId: string;
	date: Date;
	startTime: string;
	endTime: string;
	price: number;
	status?: AppointmentStatus;
	pendingApprovalFrom?: UserRole | null;
	createdByRole: UserRole;
	createdByUserId: string;
	rejectionReason?: string | null;
	rejectedByUserId?: string | null;
	rejectedAt?: Date | null;
	confirmedAt?: Date | null;
	confirmedByUserId?: string | null;
	completedAt?: Date | null;
	cancelledByUserId?: string | null;
	cancelledAt?: Date | null;
	cancelReason?: string | null;
	clientNotes?: string | null;
	professionalNotes?: string | null;
};

export type UpdateAppointmentInput = {
	status?: AppointmentStatus;
	pendingApprovalFrom?: UserRole | null;
	rejectionReason?: string | null;
	rejectedByUserId?: string | null;
	rejectedAt?: Date | null;
	confirmedAt?: Date | null;
	confirmedByUserId?: string | null;
	completedAt?: Date | null;
	cancelledByUserId?: string | null;
	cancelledAt?: Date | null;
	cancelReason?: string | null;
	clientNotes?: string | null;
	professionalNotes?: string | null;
};

export type CreateAppointmentBody = {
	companyId: string;
	clientId: string;
	professionalId: string;
	serviceId: string;
	date: string;
	startTime: string;
	endTime: string;
};

export type UpdateAppointmentBody = {
	status?: AppointmentStatus;
	cancelReason?: string | null;
	clientNotes?: string | null;
	professionalNotes?: string | null;
};
