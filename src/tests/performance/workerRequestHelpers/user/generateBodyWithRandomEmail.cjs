'use strict';

const { randomUUID } = require('crypto');

module.exports = function generateBodyWithRandomEmail(request) {
    request.body = JSON.stringify({ email: `${randomUUID()}@example.com` });
    return request;
};
