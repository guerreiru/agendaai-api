export type CreateServiceInput = {
  companyId: string;
  name: string;
  description?: string | null;
  duration: number;
};

export type UpdateServiceInput = {
  companyId?: string;
  name?: string;
  description?: string | null;
  duration?: number;
};

export type CreateServiceBody = CreateServiceInput;

export type UpdateServiceBody = UpdateServiceInput;
