export interface TestConfig {
    connections: number;
    duration: number;
    workers: number;
}

export const testConfigs: TestConfig[] = [
    {
        connections: 1,
        duration: 10,
        workers: 12,
    },
    {
        connections: 5,
        duration: 10,
        workers: 12,
    },
    {
        connections: 10,
        duration: 10,
        workers: 12,
    },
    {
        connections: 25,
        duration: 10,
        workers: 12,
    },
    {
        connections: 50,
        duration: 10,
        workers: 12,
    },
    {
        connections: 100,
        duration: 10,
        workers: 12,
    },
    {
        connections: 200,
        duration: 10,
        workers: 12,
    },
    {
        connections: 400,
        duration: 10,
        workers: 12,
    },
    {
        connections: 800,
        duration: 10,
        workers: 12,
    },
    {
        connections: 1_600,
        duration: 10,
        workers: 12,
    },
    {
        connections: 3_200,
        duration: 10,
        workers: 12,
    },
    {
        connections: 6_400,
        duration: 10,
        workers: 12,
    },
    {
        connections: 10_000,
        duration: 10,
        workers: 12,
    },
];
