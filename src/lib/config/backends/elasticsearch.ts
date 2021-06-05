import {
    BackendInstantiation
} from './definitions';

import {
    importMode
} from '../utils';

type ElasticsearchInstantiationData = {
    nodeURL: string,
};

export class ElasticsearchBackendInstantiation {
    generateInstantiation(data: any, backendName?: string): string {
        const esData = data as ElasticsearchInstantiationData;

        return `
const client = new Client({ node: '${esData.nodeURL}' })

const ${backendName} = new ElasticsearchBackend(client);`;
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
        return `${importPreamble} { Client } ${modFunc('@elastic/elasticsearch')}`;
    }
}