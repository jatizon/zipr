import { type PrismaClient } from "@generated/prisma/client.js";
import * as Domain from "@src/domain/user.js";


const resolveUser = async (userId: number, prisma: PrismaClient) => {
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (dbUser === null) {
        return null;
    }

    return Domain.userFromPersistence(dbUser);
};

export default resolveUser;
