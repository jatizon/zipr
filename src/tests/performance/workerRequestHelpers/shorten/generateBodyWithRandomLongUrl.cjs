'use strict';

const { randomUUID } = require('crypto');

module.exports = function generateBodyWithRandomLongUrl(request, context) {
    request.body = JSON.stringify({
        ownerId: context.ownerId,
        longUrl: `https://example.com/${randomUUID()}`,
    });
    return request;
};
