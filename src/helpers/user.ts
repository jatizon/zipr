export const normalizeEmail = (email: string) => email.normalize("NFKC").toLowerCase();

export const isEmailValid = (email: string) => /^[^@\s]+@[^@\s]+$/.test(email);