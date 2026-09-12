import { Type } from "@sinclair/typebox";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const UserPlain = Type.Object(
  {
    id: Type.Integer(),
    email: Type.String(),
    passwordHash: Type.String(),
    role: Type.String(),
    tier: Type.String(),
  },
  { additionalProperties: false },
);

export const UserRelations = Type.Object(
  {
    urls: Type.Array(
      Type.Object(
        {
          id: Type.Integer(),
          ownerId: Type.Integer(),
          longUrl: Type.String(),
          shortUrl: __nullable__(Type.String()),
          shorteningType: Type.String(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const UserPlainInputCreate = Type.Object(
  {
    email: Type.String(),
    passwordHash: Type.String(),
    role: Type.String(),
    tier: Type.String(),
  },
  { additionalProperties: false },
);

export const UserPlainInputUpdate = Type.Object(
  {
    email: Type.Optional(Type.String()),
    passwordHash: Type.Optional(Type.String()),
    role: Type.Optional(Type.String()),
    tier: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const UserRelationsInputCreate = Type.Object(
  {
    urls: Type.Optional(
      Type.Object(
        {
          connect: Type.Array(
            Type.Object(
              {
                id: Type.Integer({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const UserRelationsInputUpdate = Type.Partial(
  Type.Object(
    {
      urls: Type.Partial(
        Type.Object(
          {
            connect: Type.Array(
              Type.Object(
                {
                  id: Type.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: Type.Array(
              Type.Object(
                {
                  id: Type.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const UserWhere = Type.Partial(
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
          email: Type.String(),
          passwordHash: Type.String(),
          role: Type.String(),
          tier: Type.String(),
        },
        { additionalProperties: false },
      ),
    { $id: "User" },
  ),
);

export const UserWhereUnique = Type.Recursive(
  (Self) =>
    Type.Intersect(
      [
        Type.Partial(
          Type.Object(
            { id: Type.Integer(), email: Type.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        Type.Union(
          [
            Type.Object({ id: Type.Integer() }),
            Type.Object({ email: Type.String() }),
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
              email: Type.String(),
              passwordHash: Type.String(),
              role: Type.String(),
              tier: Type.String(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "User" },
);

export const UserSelect = Type.Partial(
  Type.Object(
    {
      id: Type.Boolean(),
      email: Type.Boolean(),
      passwordHash: Type.Boolean(),
      role: Type.Boolean(),
      tier: Type.Boolean(),
      urls: Type.Boolean(),
      _count: Type.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const UserInclude = Type.Partial(
  Type.Object(
    { urls: Type.Boolean(), _count: Type.Boolean() },
    { additionalProperties: false },
  ),
);

export const UserOrderBy = Type.Partial(
  Type.Object(
    {
      id: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      email: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      passwordHash: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      role: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      tier: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const User = Type.Composite([UserPlain, UserRelations], {
  additionalProperties: false,
});

export const UserInputCreate = Type.Composite(
  [UserPlainInputCreate, UserRelationsInputCreate],
  { additionalProperties: false },
);

export const UserInputUpdate = Type.Composite(
  [UserPlainInputUpdate, UserRelationsInputUpdate],
  { additionalProperties: false },
);
