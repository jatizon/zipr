import { readFileSync } from "node:fs";


export const getEnvOrThrow = (name: string): string => {
    const value = process.env[name];

    if (value === undefined || value === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

export const readRawEnvFromFileOrThrow = (filePath: string, name: string): string => {
    const line = readFileSync(filePath, "utf8")
        .split("\n")
        .find((line) => line.startsWith(`${name}=`));

    if (line === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return line
        .slice(`${name}=`.length)
        .trim()
        .replace(/^["']|["']$/g, "");
};

export const assertEnvMatchesFileOrThrow = (filePath: string, name: string): void => {
    const actual = getEnvOrThrow(name);
    const expected = readRawEnvFromFileOrThrow(filePath, name);

    if (actual !== expected) {
        throw new Error(
            `Test guard: refusing to run.\n` +
            `  expected ${name}=${expected} (from ${filePath})\n` +
            `  actual   ${name}=${actual}\n` +
            `Run the suite through the npm scripts, which set ` +
            `DOTENV_CONFIG_PATH=${filePath}`,
        );
    }
};