import Type from 'typebox';


export const AutoParams = Type.Object({
    shortUrl: Type.String(),
});

export const CustomParams = Type.Object({
    shortUrl: Type.String(),
});

export const RedirectResponse = Type.Null({
    description: "Redirects to the long URL",
});
