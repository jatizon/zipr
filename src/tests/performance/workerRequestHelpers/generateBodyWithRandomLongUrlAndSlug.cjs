'use strict';

const { randomUUID } = require('crypto');

module.exports = function generateBodyWithRandomLongUrlAndSlug(request, context) {
    request.body = JSON.stringify({
        ownerId: context.ownerId,
        longUrl: `https://example.com/${randomUUID()}`,
        shortUrl: randomUUID().replace(/-/g, '').slice(0, 20),
    });
    return request;
};
