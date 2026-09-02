import Type from 'typebox';


export const EncodeBody = Type.Object({
    urlId: Type.Number(),
});

export const DecodeBody = Type.Object({
    shortUrl: Type.String(),
});
