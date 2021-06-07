import { config, string } from "yargs";

export interface Config {
    generate(): string
}

export type ResourceGeneration = {
    resource: string,
    collection: string,
    count: number,
};

export type Action = {
    action: string,
    storageBackend: string,
    backendName?: string,
    serializer?: string,
    configuration: any,
    generate: ResourceGeneration[],
};

export type LinkedFieldConfig = {
    obj: string,
    field: string,
};

export type ResourceFieldConfig = {
    linkage: LinkedFieldConfig,
};

export type ResourceField = {
    name: string,
    type: string,
    config?: ResourceFieldConfig,
    options?: any,
};

export type LocalFileResourceReference = {
    path: string,
};

export type ResourceReference = {
    type: string,
    config: any,
};

export type Resource = {
    name: string,
    fieldName?: string,
    fields?: ResourceField[],
    reference?: ResourceReference,
};

export type ConfigData = {
    resources: Resource[],
    actions: Action[],
};