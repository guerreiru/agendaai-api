export type CreateAvailabilityInput = {
	professionalId: string;
	weekday: number;
	startTime: string;
	endTime: string;
	isActive?: boolean;
};

export type CreateBulkAvailabilityInput = {
	professionalId: string;
	slots: Omit<CreateAvailabilityInput, "professionalId">[];
};

export type UpdateAvailabilityInput = {
	weekday?: number;
	startTime?: string;
	endTime?: string;
	isActive?: boolean;
};

export type CreateAvailabilityBody = CreateAvailabilityInput;

export type CreateBulkAvailabilityBody = CreateBulkAvailabilityInput;

export type UpdateAvailabilityBody = UpdateAvailabilityInput;
