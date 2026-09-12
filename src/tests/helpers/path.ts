import { fileURLToPath } from "url";
import { packageDirectorySync } from 'package-directory';
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";


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

export const saveObjectIntoFile = async (obj: unknown, folder: string) => {
    await mkdir(folder, { recursive: true });

    const fileName = `${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;

    const filePath = join(folder, fileName);

    await writeFile(
        filePath,
        JSON.stringify(obj, null, 2),
        "utf-8",
    );

    return filePath;
};