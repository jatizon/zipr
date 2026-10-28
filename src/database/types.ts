import { type Static } from '@sinclair/typebox';
import { UrlPlain } from '@prismabox/Url.js';
import { UserPlain } from '@prismabox/User.js';


export const Url = UrlPlain;
export const User = UserPlain;

export type Url = Static<typeof UrlPlain>;
export type User = Static<typeof UserPlain>;
