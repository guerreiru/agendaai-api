export type CreateCompanyInput = {
  name: string;
  slug: string;
  ownerId: string;
  timezone: string;
  phone?: string | null;
};

export type UpdateCompanyInput = {
  name?: string;
  slug?: string;
  ownerId?: string;
  timezone?: string;
  phone?: string | null;
};

export type CreateCompanyBody = CreateCompanyInput;

export type UpdateCompanyBody = UpdateCompanyInput;
