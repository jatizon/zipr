import { Role, Tier, type Dependencies } from "@src/interfaces.js";
import { type TypeBoxFastifyInstance } from "@src/build.js";
import * as User from "@src/routes/types/user.types.js";
import { isEmailValid } from "@src/helpers/user.js";
import { hashPassword, verifyPasswordHash } from "@src/helpers/auth.js";
import { createJwtToken } from "@src/helpers/auth.js";
import { JWT_EXPIRATION_TIME } from "@src/config/auth.js";


export default async function userRoutes(
    fastify: TypeBoxFastifyInstance,
    {prisma}: Dependencies,
) {
    fastify.post("/create", {
        schema: {body: User.CreateBody}
    }, async (request, reply) => {
        if (! isEmailValid(request.body.email))
            return reply.badRequest("Invalid email");

        const userAlreadyExists = await prisma.user.count({
            where: {
                email: request.body.email,
            },
        }) > 0;
        if (userAlreadyExists)
            return reply.conflict("User already exists");

        const passwordHash = await hashPassword(request.body.password);
        const createdUser = await prisma.user.create({
            data: {
                email: request.body.email,
                passwordHash,
                role: Role.User,
                tier: Tier.Free,
            }
        });
        return reply.code(201).send({id: createdUser.id});
    });

    fastify.post("/login", {
        schema: {body: User.LoginBody}
    }, async (request, reply) => {
        const user = await prisma.user.findUnique({
            where: {
                id: request.body.id,
            }
        });
        if(user === null)
            return reply.unauthorized();

        const authenticated = await verifyPasswordHash(request.body.password, user.passwordHash);
        if (!authenticated)
            return reply.unauthorized();

        const jwtTokenPayload = {sub: String(user.id)};
        const token = createJwtToken(jwtTokenPayload, JWT_EXPIRATION_TIME);

        return token;
    });
};