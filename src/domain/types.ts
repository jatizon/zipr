import { Type, type Static } from '@sinclair/typebox';
import { Role, ShorteningTypes, Tier } from "@src/interfaces.js";


export const Url = Type.Object(
    {
        id: Type.Integer(),
        ownerId: Type.Integer(),
        longUrl: Type.String(),
        shortUrl: Type.String(),
        type: Type.Enum(ShorteningTypes),
    },
    { additionalProperties: false },
);

export const User = Type.Object(
    {
        id: Type.Integer(),
        email: Type.String(),
        role: Type.Enum(Role),
        tier: Type.Enum(Tier),
    },
    { additionalProperties: false },
);

export type Url = Static<typeof Url>;
export type User = Static<typeof User>;
