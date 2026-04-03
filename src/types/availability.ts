export type CreateAvailabilityInput = {
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type UpdateAvailabilityInput = {
  weekday?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
};

export type CreateAvailabilityBody = CreateAvailabilityInput;

export type UpdateAvailabilityBody = UpdateAvailabilityInput;
