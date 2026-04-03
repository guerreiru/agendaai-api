import type { UserRole } from "./user";

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
};

export type UpdateAppointmentInput = {
  status?: AppointmentStatus;
  pendingApprovalFrom?: UserRole | null;
  rejectionReason?: string | null;
  rejectedByUserId?: string | null;
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
};
