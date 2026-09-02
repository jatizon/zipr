import Fastify, { type FastifyInstance } from "fastify";
import { type Dependencies } from "@src/interfaces.js";
import { registerPlugins, registerRoutes } from "@src/build.js";
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';


type MockedDependencies = { [K in keyof Dependencies]: unknown };

export const buildFastifyWithMockedDependencies = (dependencies: MockedDependencies): FastifyInstance => {
    const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();

    registerPlugins(fastify);
    registerRoutes(fastify, dependencies as Dependencies);

    return fastify;
};
