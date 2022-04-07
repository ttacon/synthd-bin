import { writeFileSync } from 'fs';

import type { ResourceSchema } from './types';


const synthdTypeMap = new Map<string,string>([
    ['date', 'Date'],
    ['firstName', 'FirstName'],
    ['lastName', 'LastName'],
    ['name', 'Name'],
    ['ipAddress', 'IPAddress'],
    ['string', 'Paragraph']
]);

export default class SchemaGenerator {
    schemas: ResourceSchema[];

    collectedTypes: Set<string>;

    typeDefinitionBuffers: Map<string, string>;


    constructor(schemas: ResourceSchema[]) {
        this.schemas = schemas;
        this.collectedTypes = new Set<string>();
        this.typeDefinitionBuffers = new Map<string, string>();
    }

    build() {
        for (const schema of this.schemas) {
            this.generateTS(schema)
        }
    }

    generateTS(schema: ResourceSchema) {
        const { resourceName: name, fields } = schema;
        let buffer = `const ${name} = new Generatable('${name}', [\n`;

        for (const field of fields) {
            this.collectedTypes.add(field.likelyType);
            if (!synthdTypeMap.has(field.likelyType)) {
                throw new Error(`no such field: ${field.likelyType}`);
            }

            buffer += `    new ${synthdTypeMap.get(field.likelyType)}('${field.name}'),\n`;
        }

        buffer += ']);\n';

        this.typeDefinitionBuffers.set(name, buffer);
    }

    generateTypePreamble(): string {
        return `
import {
    Generatable,
${Array.from(this.collectedTypes.values()).map((value) => `    ${value},`).join('\n')}
} from 'synthd';
`;
    }

    write(outputFile: string) {
        const outputBuffer = [
           this.generateTypePreamble(),
            ...Array.from(this.typeDefinitionBuffers.values()),
        ].join('\n');

        let outputFunc = (buf: string) => {
            writeFileSync(outputFile, buf);
        };
        if (outputFile === 'stdout') {
            outputFunc = console.log;
        }

        outputFunc(outputBuffer);
    }
}
