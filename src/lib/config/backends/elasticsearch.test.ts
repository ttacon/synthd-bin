import {
    ElasticsearchBackendInstantiation
} from './elasticsearch';

describe('MongoBackendInstantiation', () => {
    describe('importStatement', () => {
        it('should correctly generate cjs imports', () => {
            const mbi = new ElasticsearchBackendInstantiation();
            expect(mbi.importStatement('cjs')).toEqual("const { Client } = require('@elastic/elasticsearch');");
        });

        it('should correctly generate imports for the default value', () => {
            const mbi = new ElasticsearchBackendInstantiation();
            expect(mbi.importStatement()).toEqual("const { Client } = require('@elastic/elasticsearch');");
        });

        it('should correctly generate esm imports', () => {
            const mbi = new ElasticsearchBackendInstantiation();
            expect(mbi.importStatement('esm')).toEqual("import { Client } from '@elastic/elasticsearch';");
        });
    });

    describe('generateInstantiation', () => {
        it('should correctly generate cjs imports', () => {
            const mbi = new ElasticsearchBackendInstantiation();
            expect(
                mbi.generateInstantiation({
                    nodeURL: 'http://localhost:9200',
                }),
            ).toEqual(`
const client = new Client({ node: 'http://localhost:9200' });

const esBackend = new ElasticsearchBackend(client);`);
        });

        it('should correctly generate esm imports', () => {
            const mbi = new ElasticsearchBackendInstantiation();
            expect(
                mbi.generateInstantiation({
                    nodeURL: 'http://localhost:9200',
                }, 'myBackend'),
            ).toEqual(`
const client = new Client({ node: 'http://localhost:9200' });

const myBackend = new ElasticsearchBackend(client);`);
        });
    });
});