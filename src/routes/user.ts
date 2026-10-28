import { Role, Tier, type Dependencies } from "@src/interfaces.js";
import { type TypeBoxFastifyInstance } from "@src/build.js";
import * as User from "@src/routes/types/user.types.js";
import { isEmailValid } from "@src/helpers/user.js";
import { hashPassword, verifyPasswordHash } from "@src/helpers/auth.js";
import { createJwtToken } from "@src/helpers/auth.js";
import { JWT_EXPIRATION_TIME } from "@src/config/auth.js";
import { loadUserWithPasswordHashByEmail, loadUserByEmail, saveUser } from "@src/repositories/user.js";


export default async function userRoutes(
    fastify: TypeBoxFastifyInstance,
    { prisma, cacheManager }: Dependencies,
) {
    fastify.post("/create", {
        schema: { body: User.CreateBody }
    }, async (request, reply) => {
        if (! isEmailValid(request.body.email))
            return reply.badRequest("Invalid email");

        const userAlreadyExists = await loadUserByEmail(
            request.body.email,
            { prisma, cacheManager },
        ) !== null;
        if (userAlreadyExists)
            return reply.conflict("User already exists");

        const passwordHash = await hashPassword(request.body.password);
        const createdUser = await saveUser(
            {
                email: request.body.email,
                passwordHash,
                role: Role.User,
                tier: Tier.Free,
            },
            { prisma, cacheManager },
        );
        return reply.code(201).send({ id: createdUser.id });
    });

    fastify.post("/login", {
        schema: { body: User.LoginBody }
    }, async (request, reply) => {
        const user = await loadUserWithPasswordHashByEmail(request.body.email, { prisma });
        if(user === null)
            return reply.unauthorized();

        const authenticated = await verifyPasswordHash(request.body.password, user.passwordHash);
        if (!authenticated)
            return reply.unauthorized();

        const jwtTokenPayload = { sub: String(user.id) };
        const token = createJwtToken(jwtTokenPayload, JWT_EXPIRATION_TIME);

        return token;
    });
};