export type CreateProfessionalServiceInput = {
  professionalId: string;
  serviceId: string;
  price: number;
  isActive?: boolean;
};

export type UpdateProfessionalServiceInput = {
  professionalId?: string;
  serviceId?: string;
  price?: number;
  isActive?: boolean;
};

export type CreateProfessionalServiceBody = CreateProfessionalServiceInput;

export type UpdateProfessionalServiceBody = UpdateProfessionalServiceInput;
