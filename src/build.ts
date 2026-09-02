import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import rootRoutes from "@src/routes/root.js";
import redirectRoutes from "@src/routes/redirect.js";
import adminRoutes from "./routes/admin.js";
import shortenRoutes from "./routes/shorten.js";
import userRoutes from "./routes/user.js";
import type { Dependencies } from "./interfaces.js";
import fastifyRoutes from "@fastify/routes";
import { getEnvOrThrow } from "@src/config/env.js";


export const registerPlugins = (fastify: FastifyInstance) => {
    const port = getEnvOrThrow("PORT");

    fastify.register(sensible);
    fastify.register(fastifyRoutes);
    fastify.register(cors, {
        origin: (origin, cb) => {
            const allowedOrigins = [
                `http://localhost:${port}`,
                `http://127.0.0.1:${port}`,
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                cb(null, true);
            } else {
                cb(new Error("Not allowed"), false);
            }
        }
    });
    fastify.register(swagger, {
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'zipr',
                description: 'URL shortener API',
                version: '1.0.0',
            },
            servers: [
                { url: `http://localhost:${port}`, description: 'Local development' },
            ],
            tags: [
                { name: 'redirect', description: 'Resolving a short URL into its target' },
                { name: 'shorten', description: 'Creating short URLs' },
                { name: 'user', description: 'User management' },
                { name: 'admin', description: 'Base62 encoding helpers, for debugging' },
            ],
        },
    });
    fastify.register(swaggerUi, {
        routePrefix: '/docs',
    });
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
    fastify.register(adminRoutes, { prefix: routePrefixes.admin });
    fastify.register(shortenRoutes, { prefix: routePrefixes.shorten, ...dependencies });
    fastify.register(userRoutes, { prefix: routePrefixes.user, ...dependencies });
};

const buildFastify = (dependencies: Dependencies, fastifyArgs: FastifyServerOptions) => {
    const fastify = Fastify({...fastifyArgs}).withTypeProvider<TypeBoxTypeProvider>();

    registerPlugins(fastify);
    registerRoutes(fastify, dependencies);
    
    return fastify;
};

export type TypeBoxFastifyInstance = ReturnType<typeof buildFastify>;
export default buildFastify;

