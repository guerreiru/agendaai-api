export type CreateCompanyInput = {
  name: string;
  slug: string;
  ownerId: string;
  timezone: string;
};

export type UpdateCompanyInput = {
  name?: string;
  slug?: string;
  ownerId?: string;
  timezone?: string;
};

export type CreateCompanyBody = CreateCompanyInput;

export type UpdateCompanyBody = UpdateCompanyInput;
