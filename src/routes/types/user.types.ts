import Type from 'typebox';


export const CreateBody = Type.Object({
    email: Type.String(),
    password: Type.String(),
});

export const LoginBody = Type.Object({
    email: Type.String(),
    password: Type.String(),
});

export const CreateResponse = Type.Object({
    id: Type.Integer(),
});

export const LoginResponse = Type.String();
