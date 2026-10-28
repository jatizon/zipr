import { type PrismaClient } from "@generated/prisma/client.js";
import { type MultiLevelCacheManager } from "@src/cache/manager.js";


export enum ShorteningTypes {
    Auto = "Auto",
    Custom = "Custom",
}

export enum Role {
    User = "User",
    Admin = "Admin",
}

export enum Tier {
    Free = "Free",
    Pro = "Pro",
}

export interface Dependencies {
    prisma: PrismaClient;
    cacheManager: MultiLevelCacheManager;
}