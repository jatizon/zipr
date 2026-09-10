import { type Role, type Tier } from "@src/interfaces.js";
import type * as Prisma from "@generated/prisma/client.js";


export type User = {
    id: number;
    email: string;
    role: Role;
    tier: Tier;
};

export const prismaUserToDomain = (prismaUser: Prisma.User): User => ({
    id: prismaUser.id,
    email: prismaUser.email,
    role: prismaUser.role as Role,
    tier: prismaUser.tier as Tier,
});