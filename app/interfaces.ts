export enum ShorteningTypes {
    Auto,
    Custom,
}

export interface ShortenBodyType {
    ownerId: number,
    longUrl: string,
    shortUrl: string | null,
    shortening_type: ShorteningTypes 
} 

export interface TestEncodeParamsType {
    urlId: number,
}

export interface TestDecodeParamsType {
    shortUrl: string,
}

export interface RedirectParamsType {
    shortUrl: string,
    shortening_type: ShorteningTypes,
}