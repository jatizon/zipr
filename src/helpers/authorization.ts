import { Role, Tier } from "@src/interfaces.js";
import { type Domain } from "@src/domain/index.js";


export const ensureRoleIn = (allowedRoles: Role[], user: Domain.User): boolean =>
    allowedRoles.includes(user.role);

export const ensureTierIn = (allowedTiers: Tier[], user: Domain.User): boolean =>
    allowedTiers.includes(user.tier);
