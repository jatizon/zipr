import { Role, Tier } from "@src/interfaces.js";
import { type User } from "@src/domain/user.js";


export const ensureRoleIn = (allowedRoles: Role[], user: User): boolean =>
    allowedRoles.includes(user.role);

export const ensureTierIn = (allowedTiers: Tier[], user: User): boolean =>
    allowedTiers.includes(user.tier);
