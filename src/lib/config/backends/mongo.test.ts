import {
    MongoBackendInstantiation
} from './mongo';

describe('MongoBackendInstantiation', () => {
    describe('importStatement', () => {
        it('should correctly generate cjs imports', () => {
            const mbi = new MongoBackendInstantiation();
            expect(mbi.importStatement('cjs')).toEqual("const mongoist = require('mongoist');");
        });

        it('should correctly generate imports for the default value', () => {
            const mbi = new MongoBackendInstantiation();
            expect(mbi.importStatement()).toEqual("const mongoist = require('mongoist');");
        });

        it('should correctly generate esm imports', () => {
            const mbi = new MongoBackendInstantiation();
            expect(mbi.importStatement('esm')).toEqual("import mongoist from 'mongoist';");
        });
    });

    describe('generateInstantiation', () => {
        it('should correctly generate cjs imports', () => {
            const mbi = new MongoBackendInstantiation();
            expect(
                mbi.generateInstantiation({
                    mongoURI: 'mongodb://localhost:27017/db',
                }),
            ).toEqual(`
const db = mongoist('mongodb://localhost:27017/db');

const mongoistBackend = new MongoistBackend(db);`);
        });

        it('should correctly generate esm imports', () => {
            const mbi = new MongoBackendInstantiation();
            expect(
                mbi.generateInstantiation({
                    mongoURI: 'mongodb://localhost:27017/db',
                }, 'myBackend'),
            ).toEqual(`
const db = mongoist('mongodb://localhost:27017/db');

const myBackend = new MongoistBackend(db);`);
        });
    });
});