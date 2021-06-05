import { config } from "yargs";

export interface Config {
    generate(): string
    run(): void
}

export type ResourceGeneration = {
    resource: string,
    collection: string,
    count: number,
};

export type Action = {
    action: string,
    storageBackend: string,
    serializer?: string,
    configuration: any,
    generate: ResourceGeneration[],
};

export type ResourceField = {
    name: string,
    type: string,
};

export type Resource = {
    name: string,
    fieldName?: string,
    fields: ResourceField[],
};

export type ConfigData = {
    resources: Resource[],
    actions: Action[],
};