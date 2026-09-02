import { type PrismaClient } from "@generated/prisma/client.js";


export enum ShorteningTypes {
    Auto = "Auto",
    Custom = "Custom",
}

export interface Dependencies {
    prisma: PrismaClient;
}