import { test, expect } from "vitest";
import { buildFastify } from "@app/app.js";
import { ShorteningTypes } from "@app/interfaces.js";
import { encodeBase62, decodeBase62 } from "@app/utils.js";
import rootRoutes from "@app/routes/root.js";


const fastify = buildFastify();

fastify.register(rootRoutes);

test("POST /shorten", async () => {
    expect.assertions(0);
    const response = await fastify.inject({
        method: "POST",
        url: "/shorten",
        payload: {
            ownerId: 1,
            longUrl: "https://google4.com",
            shortening_type: ShorteningTypes.Auto 
        },
    });
    const responseBody = JSON.parse(response.body);
    const expectedResult = encodeBase62(1);
    expect({ shortUrl: responseBody.shortUrl }).toEqual({ shortUrl: expectedResult});
});
