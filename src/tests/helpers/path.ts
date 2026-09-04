import { fileURLToPath } from "url";
import { packageDirectory, packageDirectorySync } from 'package-directory';
import path from "node:path";


export const resolvePathFromUrl = (relativePath: string, baseUrl: string) => {
    return fileURLToPath(new URL(relativePath, baseUrl));
};

export const resolvePathFromPackageRoot = (relativePath: string) => {
    const packageRoot = packageDirectorySync();
    if (packageRoot === undefined) {
        throw new Error("Could not find package root");
    }
    return path.resolve(packageRoot, relativePath);
};
