import { Role, Tier } from "@src/interfaces.js";
import type * as Domain from "@src/domain/user.js";


export const ensureRoleIn = (allowedRoles: Role[], user: Domain.User): boolean =>
    allowedRoles.includes(user.role);

export const ensureTierIn = (allowedTiers: Tier[], user: Domain.User): boolean =>
    allowedTiers.includes(user.tier);
