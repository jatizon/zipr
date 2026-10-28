import { createJwtToken } from "@src/helpers/auth.js";


export const generateTokenForUserId = (userId: number) => {
    return createJwtToken({ sub: String(userId) });
};