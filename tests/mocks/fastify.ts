import { type FastifyServerOptions } from "fastify";
import { type Dependencies } from "@src/interfaces.js";
import buildFastify, { plugins, type PluginRegistration, type TypeBoxFastifyInstance } from "@src/build.js";


type MockedDependencies = { [K in keyof Dependencies]: unknown };

const { rateLimit, ...pluginsWithoutRateLimit } = plugins;
export { pluginsWithoutRateLimit };

export const buildFastifyWithMockedDependencies = (
    fastifyArgs: FastifyServerOptions,
    dependencies: MockedDependencies,
    plugins: Record<string, PluginRegistration>,
): TypeBoxFastifyInstance => {
    return buildFastify(fastifyArgs, dependencies as Dependencies, plugins);
};
