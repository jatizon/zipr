import { type Dependencies } from "@src/interfaces.js";
import { type TypeBoxFastifyInstance } from "@src/build.js";
import * as User from "@src/routes/types/user.types.js";
import { isEmailValid } from "@src/helpers/user.js";


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

        const createdUser = await prisma.user.create({
            data: {
                email: request.body.email,
            }
        });
        return reply.code(201).send({id: createdUser.id});
    });
};