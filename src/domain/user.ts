import { type Role, type Tier } from "@src/interfaces.js";
import { type Prisma } from "@generated/prisma/client.js";


export type User = {
    id: number;
    email: string;
    role: Role;
    tier: Tier;
};

export const userFromPersistence = (prismaUser: Prisma.UserModel): User => ({
    id: prismaUser.id,
    email: prismaUser.email,
    role: prismaUser.role as Role,
    tier: prismaUser.tier as Tier,
});