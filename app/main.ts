import { buildFastify } from "@app/app.js";
import { startServer } from "@app/server.js";
import rootRoutes from "@app/routes/root.js";


const fastify = buildFastify();

fastify.register(rootRoutes,);

startServer(fastify);



