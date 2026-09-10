import { type FastifyReply, type FastifyRequest } from "fastify";
import { getValidatedPayload } from "@src/helpers/auth.js";


export type AuthRequest = FastifyRequest<{
    Headers: {
        authorization: string;
    };
}>;

const authHook = async (request: AuthRequest, reply: FastifyReply) => {
    const [scheme, token] = request.headers.authorization.split(' ');

    if (scheme !== 'Bearer')
        return reply.badRequest("Invalid authorization scheme");

    if (token === undefined)
        return reply.badRequest("Missing authorization token");

    const payload = await getValidatedPayload(token);
    if (payload === null)
        return reply.unauthorized("Invalid token");

    if (payload.sub === undefined) {
        return reply.unauthorized("Invalid token");
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId < 1) {
        return reply.unauthorized("Invalid token");
    }

    request.userId = userId;
};

export default authHook;