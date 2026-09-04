import { MAX_SLUG_LENGTH } from '@src/config/limits.js';


// All entries verified against is-url-http. Careful when adding cases:
// "http:/example.com" (single slash), "http://localhost" and "http://127.0.0.1"
// are accepted by the library and do not work as invalid input.
export const invalidUrls = [
    '',                       // empty
    '   ',                    // whitespace only
    'invalid-url',            // no scheme
    'example.com',            // bare domain
    'www.example.com',        // bare domain with www
    '//example.com',          // protocol-relative
    'https//example.com',     // missing colon
    'htp://example.com',      // typo in scheme
    'http://',                // scheme only
    'ftp://example.com',      // non-http scheme
    'mailto:someone@example.com',
    'file:///etc/passwd',
    'javascript:alert(1)',    // dangerous scheme
    'http://exa mple.com',    // space in host
    'https://example',        // no TLD
    'https://.com',           // no host
    'https://example..com',   // doubled dot
];

export const validUrls = [
    'https://example.com',
    'http://example.com',                       // http is valid too
    'https://www.example.com',
    'https://example.com/',                     // trailing slash
    'https://example.com/a/b/c',                // path
    'https://example.com/path/',                // path with trailing slash
    'https://example.com//double//slash',
    'https://example.com/path?query=1',         // query string
    'https://example.com/a?x=1&y=2',            // multiple params
    'https://example.com?x=1',                  // query with no path
    'https://example.com/?',                    // empty query
    'https://example.com/path#section',         // fragment
    'https://example.com#frag',                 // fragment with no path
    'https://example.com/#',                    // empty fragment
    'https://example.com/a%20b',                // percent encoding
    'https://example.com/a+b',
    'https://example.com:8080',                 // port
    'https://example.com:65535',                // highest port
    'https://sub.domain.example.com',           // subdomain
    'https://a.b.c.d.example.com',              // deep subdomains
    'https://my-site.example.com',              // hyphen in host
    'https://example.co.uk',                    // multi-part TLD
    'https://example.museum',                   // long TLD
    'https://xn--80ak6aa92e.com',               // punycode
    'http://localhost:3000',                    // host without TLD
    'http://127.0.0.1',                         // IPv4
    'https://192.168.0.1:443',                  // IPv4 with port
    'http://[::1]',                             // IPv6
    'http://[2001:db8::1]:8080',                // IPv6 with port
    'HTTPS://EXAMPLE.COM',                      // uppercase scheme and host
    'HTTP://EXAMPLE.COM',
    'HtTpS://Example.com',                      // mixed case scheme
    'https://EXAMPLE.com',                      // uppercase host only
    ' https://example.com',                     // leading space — accepted by the validator
    'https://example.com ',                     // trailing space
    '\thttps://example.com',                    // leading tab
    `https://example.com/${'x'.repeat(300)}`,   // long path
];


export const userExamples = [
    { email: 'user123@example.com' },
    { email: 'john.doe@example.com' },
    { email: 'alice.smith@example.com' },
    { email: 'bob.marley@example.com' },
    { email: 'maria99@example.com' },
    { email: 'peter.scott@example.com' },
    { email: 'devops2026@example.com' },
    { email: 'ana.paula.souza@example.com' },
    { email: 'k@example.com' },
    { email: 'long.username@example.com' },
];


// All entries verified against isEmailValid itself. The check is only
// /^[^@\s]+@[^@\s]+$/ — exactly one "@", no whitespace, nothing else — so the
// only things it rejects are a missing/duplicated "@", an empty side, and
// whitespace. Everything a stricter validator would catch lives in validEmails
// below, because this one accepts it.
export const invalidEmails = [
    '',                       // empty
    '   ',                    // whitespace only
    'user',                   // no @
    'user.example.com',       // dots, still no @
    '@example.com',           // empty local part
    'user@',                  // empty domain
    '@',                      // both sides empty
    'user@@example.com',      // doubled @
    'user@exam@ple.com',      // two @ apart
    'user @example.com',      // space in local part
    'user@ example.com',      // space after the @
    'user@exa mple.com',      // space in domain
    ' user@example.com',      // leading space
    'user@example.com ',      // trailing space
    '\tuser@example.com',     // leading tab
    'user@example.com\n',     // trailing newline — JS "$" does not forgive it
];

// Accepted by isEmailValid, and the second half of the list is the point: the
// check demands no TLD, no sane labels, not even plausible characters. If these
// ever start failing, the validator got stricter on purpose.
export const validEmails = [
    'user123@example.com',
    'john.doe@example.com',
    'k@example.com',                 // single-character local part
    'user+tag@example.com',          // plus addressing
    'user@sub.domain.example.co.uk', // deep subdomains, multi-part TLD
    'UPPER@EXAMPLE.COM',             // uppercase
    'a@b',                           // the smallest shape that passes
    'user@example',                  // no TLD required
    'user@localhost',
    'user@example..com',             // doubled dot
    'user@.com',                     // empty label
    'user@example.com.',             // trailing dot
    '"user"@example.com',            // quotes are neither "@" nor whitespace
    'user@[192.168.0.1]',            // bracketed IP
    'user@exa<>mple.com',            // characters no real domain allows
    '..@..',                         // dots on both sides, still one "@"
];


export const collidingSlugs = [
    'health',
    'docs',
    'a',
    'shorten',
    'user',
    'admin',
];

export const nonCollidingSlugs = [
    'meu-link',
    'auto',
    'static',
    'DOCS',
    'healthz',
    'doc',
];

export const validSlugs = [
    'a',                            // shortest allowed
    'abc',
    'ABC',
    '123',
    'has-dash',
    'has_underscore',
    'MiXeD-123_case',
    'x'.repeat(MAX_SLUG_LENGTH),    // exactly at the bound
];

// Rejected by SLUG_PATTERN, and every entry still reaches the handler: the
// router matches these, so the 400 comes from the route's own check.
export const invalidSlugs = [
    'has.dot',
    'has@at',
    'has~tilde',
    'has space',
    'acentuação',
    '',                                 // "/a/" still matches, with an empty param
    'x'.repeat(MAX_SLUG_LENGTH + 1),    // one past the bound
];

// Also rejected by SLUG_PATTERN, but the handler never sees them: a slash makes
// the path a different shape, so the router 404s first.
export const unroutableSlugs = [
    'has/slash',
    'two/segments',
];

// Percent-escape, query and fragment in one URL. The redirect path treats the
// long URL as an opaque string, so this is what would catch Fastify re-encoding
// it into the Location header.
export const urlWithReservedCharacters = 'https://example.com/a%20b?x=1#section';
