import Type from 'typebox';


export const AutoBody = Type.Object({
    ownerId: Type.Number(),
    longUrl: Type.String(),
});

export const CustomBody = Type.Object({
    ownerId: Type.Number(),
    longUrl: Type.String(),
    shortUrl: Type.String(),
});
