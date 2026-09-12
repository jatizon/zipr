import Type from 'typebox';


export const CreateBody = Type.Object({
    email: Type.String(),
    password: Type.String(),
});

export const LoginBody = Type.Object({
    id: Type.Number(),
    password: Type.String(),
});
