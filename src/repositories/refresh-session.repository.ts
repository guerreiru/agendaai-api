import { prisma } from "../lib/prisma.js";

export async function createRefreshSession(input: {
	userId: string;
	tokenHash: string;
	expiresAt: Date;
}) {
	return prisma.refreshSession.create({
		data: input,
	});
}

export async function findActiveRefreshSessionByHash(tokenHash: string) {
	return prisma.refreshSession.findFirst({
		where: {
			tokenHash,
			revokedAt: null,
			expiresAt: {
				gt: new Date(),
			},
		},
	});
}

export async function revokeRefreshSessionByHash(tokenHash: string) {
	return prisma.refreshSession.updateMany({
		where: {
			tokenHash,
			revokedAt: null,
		},
		data: {
			revokedAt: new Date(),
		},
	});
}

export async function revokeAllRefreshSessionsByUserId(userId: string) {
	return prisma.refreshSession.updateMany({
		where: {
			userId,
			revokedAt: null,
		},
		data: {
			revokedAt: new Date(),
		},
	});
}
