import {
    BackendInstantiation
} from './definitions';

type MongoistInstantiationData = {
    mongoURI: string,
};

export class MongoBackendInstantiation {
    generateInstantiation(data: any): string {
        const mongoData = data as MongoistInstantiationData;

        return `
const db = mongoist('${mongoData.mongoURI}');

const mongoBackend = new MongoistBackend(db);`;
    }

    /**
     * Import statement returns the import preamble for the backend.
     * 
     * NOTE(ttacon): It would be nice to improve this to support other formats
     * (e.g. commonjs).
     * 
     * @returns string The import preamble.
     */
    importStatement(): string {
        return `import mongoist from 'mongoist';`
    }
}

