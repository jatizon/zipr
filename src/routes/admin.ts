import { type TypeBoxFastifyInstance } from "@src/build.js";
import { type Dependencies } from "@src/interfaces.js";
import * as Auth from "@src/routes/types/auth.types.js";
import authHook from "@src/hooks/auth.js";
import resolveUser from "@src/helpers/resolveUser.js";
import { ensureRoleIn } from "@src/helpers/authorization.js";
import { allowedRolesForRoute } from "@src/config/authorization.js";


export default async function adminRoutes(
    fastify: TypeBoxFastifyInstance,
    { prisma }: Dependencies,
) {
    fastify.get("/dummy", {
        schema: {
            headers: Auth.AuthHeaders,
        },
        preHandler: authHook,
    }, async (request, reply) => {
        const user = await resolveUser(request.userId as number, prisma);

        if (user === null)
            return reply.notFound("User not found");

        if (!ensureRoleIn(allowedRolesForRoute.admin, user))
            return reply.forbidden();

        return reply.code(200).send({ ok: true });
    });
}
