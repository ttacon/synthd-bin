import {
    BackendInstantiation,
    ElasticsearchBackendInstantiation,
    MongoBackendInstantiation,
} from './backends';

export const BackendMap = new Map<string, BackendInstantiation>([
    ['MongoistBackend', new MongoBackendInstantiation()],
    ['ElasticsearchBackend', new ElasticsearchBackendInstantiation()],
]);