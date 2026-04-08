export interface TimeSlot {
	startTime: string;
	endTime: string;
	isAvailable: boolean;
}

export interface GetAvailableSlotsBody {
	professionalId: string;
	serviceId: string;
	date: string;
}

export interface GetAvailableSlotsResponse {
	professionalId: string;
	serviceId: string;
	date: string;
	slots: TimeSlot[];
}
