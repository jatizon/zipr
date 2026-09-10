import Fastify, {
    type FastifyInstance,
    type FastifyServerOptions,
    type FastifyPluginCallback,
    type FastifyPluginAsync,
    type FastifyPluginOptions,
    type FastifyRegisterOptions,
} from "fastify";
import { type TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyRoutes from "@fastify/routes";
import rootRoutes from "@src/routes/root.js";
import redirectRoutes from "@src/routes/redirect.js";
import adminRoutes from "./routes/admin.js";
import shortenRoutes from "./routes/shorten.js";
import userRoutes from "./routes/user.js";
import type { Dependencies } from "./interfaces.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { RATE_LIMIT_MAX, RATE_LIMIT_TIME_WINDOW } from "@src/config/limits.js";


const addDecorators = (fastify: FastifyInstance) => {
    fastify.decorateRequest("userId", undefined);
};

export type PluginRegistration = {
    plugin: FastifyPluginCallback<FastifyPluginOptions> | FastifyPluginAsync<FastifyPluginOptions>;
    options?: FastifyRegisterOptions<FastifyPluginOptions>;
};

export const plugins: Record<string, PluginRegistration> = {
    rateLimit: {
        plugin: rateLimit,
        options: {
            max: RATE_LIMIT_MAX,
            timeWindow: RATE_LIMIT_TIME_WINDOW,
        },
    },
    sensible: {
        plugin: sensible,
    },
    fastifyRoutes: {
        plugin: fastifyRoutes,
    },
    cors: {
        plugin: cors,
        options: () => {
            const port = getEnvOrThrow("PORT");
            return {
                origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
                    const allowedOrigins = [
                        `http://localhost:${port}`,
                        `http://127.0.0.1:${port}`,
                    ];
                    if (!origin || allowedOrigins.includes(origin)) {
                        cb(null, true);
                    } else {
                        cb(new Error("Not allowed"), false);
                    }
                },
            };
        },
    },
    swagger: {
        plugin: swagger,
        options: () => {
            const port = getEnvOrThrow("PORT");
            return {
                openapi: {
                    openapi: "3.1.0",
                    info: {
                        title: "zipr",
                        description: "URL shortener API",
                        version: "1.0.0",
                    },
                    servers: [
                        { url: `http://localhost:${port}`, description: "Local development" },
                    ],
                    tags: [
                        { name: "redirect", description: "Resolving a short URL into its target" },
                        { name: "shorten", description: "Creating short URLs" },
                        { name: "user", description: "User management" },
                        { name: "admin", description: "Dummy endpoint" },
                    ],
                },
            };
        },
    },
    swaggerUi: {
        plugin: swaggerUi,
        options: {
            routePrefix: "/docs",
        },
    },
};

export const registerPlugins = (
    plugins: Record<string, PluginRegistration>,
    fastify: FastifyInstance
) => {
    for (const { plugin, options } of Object.values(plugins)) {
        fastify.register(plugin, options ?? {});
    }
};

const routePrefixes = {
    root: '',
    redirect: '',
    admin: '/admin',
    shorten: '/shorten',
    user: '/user',
};

export const registerRoutes = (fastify: FastifyInstance, dependencies: Dependencies) => {
    fastify.register(rootRoutes, { prefix: routePrefixes.root });
    fastify.register(redirectRoutes, { prefix: routePrefixes.redirect, ...dependencies });
    fastify.register(adminRoutes, { prefix: routePrefixes.admin, ...dependencies });
    fastify.register(shortenRoutes, { prefix: routePrefixes.shorten, ...dependencies });
    fastify.register(userRoutes, { prefix: routePrefixes.user, ...dependencies });
};

const buildFastify = (
    fastifyArgs: FastifyServerOptions,
    dependencies: Dependencies,
    plugins: Record<string, PluginRegistration>,
) => {
    const fastify = Fastify({...fastifyArgs}).withTypeProvider<TypeBoxTypeProvider>();

    addDecorators(fastify);

    registerPlugins(plugins, fastify);
    registerRoutes(fastify, dependencies);
    
    return fastify;
};

export type TypeBoxFastifyInstance = ReturnType<typeof buildFastify>;
export default buildFastify;

