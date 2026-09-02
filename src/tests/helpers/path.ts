import { fileURLToPath } from "url";


export const resolvePath = (relativePath: string, fromUrl: string) => {
    return fileURLToPath(new URL(relativePath, fromUrl));
};