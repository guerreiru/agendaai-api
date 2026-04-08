export type UserRole =
	| "CLIENT"
	| "PROFESSIONAL"
	| "COMPANY_OWNER"
	| "ADMIN"
	| "SUPER_ADMIN";

export type SignUpUserInput = {
	name: string;
	email: string;
	phone?: string | null;
	password: string;
	role?: UserRole;
	companyId?: string;
	displayName?: string;
};

export type CreateUserBody = {
	name: string;
	email: string;
	phone?: string | null;
	password: string;
	role?: UserRole;
	companyId?: string;
	displayName?: string;
};

export type UpdateUserInput = {
	name?: string;
	email?: string;
	phone?: string | null;
	password?: string;
	role?: UserRole;
	companyId?: string;
	displayName?: string;
};

export type UpdateUserBody = {
	name?: string;
	email?: string;
	phone?: string | null;
	password?: string;
	role?: UserRole;
	companyId?: string;
	displayName?: string;
};
