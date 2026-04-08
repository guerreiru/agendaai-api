export type CreateCompanyInput = {
	name: string;
	slug: string;
	ownerId: string;
	timezone: string;
	phone?: string | null;
	autoConfirm?: boolean;
};

export type UpdateCompanyInput = {
	name?: string;
	slug?: string;
	ownerId?: string;
	timezone?: string;
	phone?: string | null;
	autoConfirm?: boolean;
};

export type CreateCompanyBody = CreateCompanyInput;

export type UpdateCompanyBody = UpdateCompanyInput;
