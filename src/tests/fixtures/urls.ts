import { MAX_SLUG_LENGTH, POSTGRES_INT4_MAX } from '@src/config/limits.js';
import { Role, Tier } from '@src/interfaces.js';
import { encodeBase62 } from '@src/helpers/base62Codec.js';


// Verified against is-url-http — "http:/example.com", "http://localhost" and
// "http://127.0.0.1" look invalid but the library accepts them; don't add them here.
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


// passwordHash is a placeholder (not real bcrypt) — entries are inserted directly
// via prisma.user.create, bypassing the hashing endpoint. role/tier default to
// lowest privilege; override at the call site when a test needs admin/pro.
export const userExamples = [
    { email: 'user123@example.com', passwordHash: 'placeholder-hash-0', role: Role.User, tier: Tier.Free },
    { email: 'john.doe@example.com', passwordHash: 'placeholder-hash-1', role: Role.User, tier: Tier.Free },
    { email: 'alice.smith@example.com', passwordHash: 'placeholder-hash-2', role: Role.User, tier: Tier.Free },
    { email: 'bob.marley@example.com', passwordHash: 'placeholder-hash-3', role: Role.User, tier: Tier.Free },
    { email: 'maria99@example.com', passwordHash: 'placeholder-hash-4', role: Role.User, tier: Tier.Free },
    { email: 'peter.scott@example.com', passwordHash: 'placeholder-hash-5', role: Role.User, tier: Tier.Free },
    { email: 'devops2026@example.com', passwordHash: 'placeholder-hash-6', role: Role.User, tier: Tier.Free },
    { email: 'ana.paula.souza@example.com', passwordHash: 'placeholder-hash-7', role: Role.User, tier: Tier.Free },
    { email: 'k@example.com', passwordHash: 'placeholder-hash-8', role: Role.User, tier: Tier.Free },
    { email: 'long.username@example.com', passwordHash: 'placeholder-hash-9', role: Role.User, tier: Tier.Free },
];


// Verified against isEmailValid's actual regex (/^[^@\s]+@[^@\s]+$/) — it only
// rejects a missing/duplicate "@", an empty side, or whitespace. Everything a
// stricter validator would catch lives in validEmails below, since this one accepts it.
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

// Accepted by isEmailValid — the second half is the point: no TLD or sane-label
// requirement at all. If these start failing, the validator got stricter on purpose.
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


// A slug collides when it equals the first path segment of an already
// registered route (customSlugCollidesWithRoute checks fastify.routes.keys()).
export const collidingSlugs = [
    'health',   // GET /health
    'docs',     // GET /docs (swagger UI)
    'a',        // GET /a/:shortUrl
    'shorten',  // POST /shorten/*
    'user',     // POST /user/*
    'admin',    // GET /admin/*
];

export const nonCollidingSlugs = [
    'meu-link', // ordinary custom slug, no route shares it
    'auto',     // "/shorten/auto"'s first segment is "shorten", not "auto"
    'static',   // no route named this
    'DOCS',     // near-miss of "docs" — the check is case-sensitive
    'healthz',  // near-miss of "health" — no prefix/substring matching
    'doc',      // near-miss of "docs" — singular, not an exact match
];

// Like nonCollidingSlugs[0], but Base62-clean and short — reaches the Auto
// endpoint's real lookup instead of being rejected by its syntax checks.
export const base62CleanNonCollidingSlug = 'zzzzz';

// One past POSTGRES_INT4_MAX, base62-encoded — isSlugWithinIdRange rejects
// it, since decodeBase62 would overflow Url.id's int4 column.
export const oversizedAutoSlug = encodeBase62(POSTGRES_INT4_MAX + 1);

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
