import { type Role, type Tier } from "@src/interfaces.js";
import { type Prisma } from "@generated/prisma/client.js";
import { type User } from "./types.js";


export const userDomainFromDatabase = (prismaUser: Prisma.UserModel): User => ({
    id: prismaUser.id,
    email: prismaUser.email,
    role: prismaUser.role as Role,
    tier: prismaUser.tier as Tier,
});
