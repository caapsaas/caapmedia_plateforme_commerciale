declare class EnvironmentVariables {
    DATABASE_URL: string;
    JWT_SECRET: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
