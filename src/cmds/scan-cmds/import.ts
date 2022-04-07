import type {
    Argv,
} from 'yargs';

import * as fs from 'fs';

import {
    JSONConfig,
} from '../../lib/config';

export const command: string = 'import';
export const desc: string = 'Generates valid synthd data types from a database.';

export function builder(yargs: Argv) {
    return yargs.options({
        dbConnectionURI: {
            describe: 'The connection URI to use to connect to the database.',
            type: 'string',
        },
        interactive: {
            describe: 'Run the import scan interactively.',
            type: 'boolean',
        },
        output: {
            describe: 'Where the generate file should be output to. Input will be considered as a filename, unless `stdout` is provided.',
            type: 'string',
            default: 'synthdOutput.ts',
        }
      });
}

type HandlerArguments = {
    dbConnectionURI: string,
    interactive: boolean,
    output: string,
};

import * as mysql from 'promise-mysql';
import parseDbUrl from 'ts-parse-database-url';


type RawDataPacket = {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: string | null;
    Extra: string;
};

import type { ResourceSchema } from './types';

import determineType from './typeDetermination';

import SchemaGenerator from './resourceGeneration';

function processTableSchema(tableName: string, data: RawDataPacket[]): ResourceSchema {
    const schema: ResourceSchema = {
        resourceName: tableName,
        fields: [],
    };

    for ( const { Field, Type, Null, Key, Default, Extra } of data ) {
        schema.fields.push({
            name: Field,
            metadata: [{
                dbType: 'mysql', // TODO(ttacon): fix this
                nullable: Null.toLowerCase() === 'yes',
                defaultValue: Default,
                keyType: Key,
                extra: Extra,
            }],
            likelyType: determineType(Field, Type),
        });
    }

    return schema;
}

export async function handler(argv: HandlerArguments) {
    const { dbConnectionURI, interactive, output } = argv;
    if (!dbConnectionURI) {
        throw new Error('must provide dbConnectionURI');
    }

    const connectionOptions = parseDbUrl(dbConnectionURI);
    const conn = await mysql.createConnection(connectionOptions);

    // Keep a hold of the `database` name, we're going to need it in a moment.
    const { database } = connectionOptions;

    const result = await conn.query('show tables;');


    const tableNames = result.map((packet: any) => packet[`Tables_in_${database}`]);

    console.log(`identified ${tableNames.length} tables`);

    // Prompt to see if we should keep going?
    // FUTURE(ttacon): add ability to look at tables and then specify specific ones here.


    const promises = tableNames.map(async (tableName: string): Promise<ResourceSchema> => {
        const result = await conn.query(`describe ${tableName};`);

        return processTableSchema(tableName, result);
    });

    const schemas: ResourceSchema[] = await Promise.all(promises);

    const generator = new SchemaGenerator(schemas);
    generator.build();
    generator.write(output);
    console.log(`output written to ${output}`);
    process.exit(0);
}
