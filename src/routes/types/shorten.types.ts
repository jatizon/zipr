import Type from 'typebox';


export const AutoBody = Type.Object({
    longUrl: Type.String(),
});

export const CustomBody = Type.Object({
    longUrl: Type.String(),
    shortUrl: Type.String(),
});
