import { Type } from "@sinclair/typebox";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const UrlPlain = Type.Object(
  {
    id: Type.Integer(),
    ownerId: Type.Integer(),
    longUrl: Type.String(),
    shortUrl: __nullable__(Type.String()),
    shorteningType: Type.String(),
  },
  { additionalProperties: false },
);

export const UrlRelations = Type.Object(
  {
    owner: Type.Object(
      {
        id: Type.Integer(),
        email: Type.String(),
        passwordHash: Type.String(),
        role: Type.String(),
        tier: Type.String(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const UrlPlainInputCreate = Type.Object(
  {
    longUrl: Type.String(),
    shortUrl: Type.Optional(__nullable__(Type.String())),
    shorteningType: Type.String(),
  },
  { additionalProperties: false },
);

export const UrlPlainInputUpdate = Type.Object(
  {
    longUrl: Type.Optional(Type.String()),
    shortUrl: Type.Optional(__nullable__(Type.String())),
    shorteningType: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const UrlRelationsInputCreate = Type.Object(
  {
    owner: Type.Object(
      {
        connect: Type.Object(
          {
            id: Type.Integer({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const UrlRelationsInputUpdate = Type.Partial(
  Type.Object(
    {
      owner: Type.Object(
        {
          connect: Type.Object(
            {
              id: Type.Integer({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
);

export const UrlWhere = Type.Partial(
  Type.Recursive(
    (Self) =>
      Type.Object(
        {
          AND: Type.Union([
            Self,
            Type.Array(Self, { additionalProperties: false }),
          ]),
          NOT: Type.Union([
            Self,
            Type.Array(Self, { additionalProperties: false }),
          ]),
          OR: Type.Array(Self, { additionalProperties: false }),
          id: Type.Integer(),
          ownerId: Type.Integer(),
          longUrl: Type.String(),
          shortUrl: Type.String(),
          shorteningType: Type.String(),
        },
        { additionalProperties: false },
      ),
    { $id: "Url" },
  ),
);

export const UrlWhereUnique = Type.Recursive(
  (Self) =>
    Type.Intersect(
      [
        Type.Partial(
          Type.Object(
            {
              id: Type.Integer(),
              shortUrl_shorteningType: Type.Object(
                { shortUrl: Type.String(), shorteningType: Type.String() },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        Type.Union(
          [
            Type.Object({ id: Type.Integer() }),
            Type.Object({
              shortUrl_shorteningType: Type.Object(
                { shortUrl: Type.String(), shorteningType: Type.String() },
                { additionalProperties: false },
              ),
            }),
          ],
          { additionalProperties: false },
        ),
        Type.Partial(
          Type.Object({
            AND: Type.Union([
              Self,
              Type.Array(Self, { additionalProperties: false }),
            ]),
            NOT: Type.Union([
              Self,
              Type.Array(Self, { additionalProperties: false }),
            ]),
            OR: Type.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        Type.Partial(
          Type.Object(
            {
              id: Type.Integer(),
              ownerId: Type.Integer(),
              longUrl: Type.String(),
              shortUrl: Type.String(),
              shorteningType: Type.String(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Url" },
);

export const UrlSelect = Type.Partial(
  Type.Object(
    {
      id: Type.Boolean(),
      ownerId: Type.Boolean(),
      longUrl: Type.Boolean(),
      shortUrl: Type.Boolean(),
      shorteningType: Type.Boolean(),
      owner: Type.Boolean(),
      _count: Type.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const UrlInclude = Type.Partial(
  Type.Object(
    { owner: Type.Boolean(), _count: Type.Boolean() },
    { additionalProperties: false },
  ),
);

export const UrlOrderBy = Type.Partial(
  Type.Object(
    {
      id: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      ownerId: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      longUrl: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      shortUrl: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      shorteningType: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Url = Type.Composite([UrlPlain, UrlRelations], {
  additionalProperties: false,
});

export const UrlInputCreate = Type.Composite(
  [UrlPlainInputCreate, UrlRelationsInputCreate],
  { additionalProperties: false },
);

export const UrlInputUpdate = Type.Composite(
  [UrlPlainInputUpdate, UrlRelationsInputUpdate],
  { additionalProperties: false },
);
