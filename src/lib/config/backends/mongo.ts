import {
    BackendInstantiation
} from './definitions';

import {
    importMode
} from '../utils';

type MongoistInstantiationData = {
    mongoURI: string,
    backendName?: string,
};

export class MongoBackendInstantiation {
    generateInstantiation(data: any, providedBackendName?: string): string {
        const mongoData = data as MongoistInstantiationData;
        const backendName = providedBackendName || 'mongoistBackend';

        return `
const db = mongoist('${mongoData.mongoURI}');

const ${backendName} = new MongoistBackend(db);`;
    }

    /**
     * Import statement returns the import preamble for the backend.
     * 
     * NOTE(ttacon): It would be nice to improve this to support other formats
     * (e.g. commonjs).
     * 
     * @returns string The import preamble.
     */
    importStatement(mode?: string): string {
        const [
            importPreamble,
            modFunc,
        ] = importMode(mode || 'cjs');
        return `${importPreamble} mongoist ${modFunc('mongoist')}`;
    }
}

