'use strict';

const { randomUUID } = require('crypto');

module.exports = function generateBodyWithRandomLongUrl(request, context) {
    request.body = JSON.stringify({
        longUrl: `https://example.com/${randomUUID()}`,
    });
    request.headers.authorization = `Bearer ${context.token}`;
    return request;
};
