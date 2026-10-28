export const MAX_SLUG_LENGTH = 20;

// Postgres `integer` (int4) max — Url.id's column type.
export const POSTGRES_INT4_MAX = 2147483647;

// Both cache levels expire entries after this long, which bounds how stale a user
// edited behind the API's back can be, and keeps `volatile-lfu` (redis.conf) able to evict.
export const CACHE_TTL_SECONDS = 10;

export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_TIME_WINDOW = '10s';
