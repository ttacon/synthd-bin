import { updateStrings } from 'yargs';

/*

Example file:

{
    "resources": [{
        "name": "Users",
        "fieldName": "users", // optional, otherwise take lower camel case of `name`
        "fields": [{
            "name": "_id",
            "type": "MongoObjectID"
        }, {
            "name": "firstName",
            "type": "FirstName"
        }, {
            "name": "lastName",
            "type": "LastName"
        }, {
            "name": "email",
            "type": "Email"
        }, {
            "name": "phoneNumber",
            "type": "PhoneNumber"
        }]
    }],
    "actions": [{
        "action": "generateAndStore",
        "storageBackend": "MongoistBackend",
        "serializer": "JSONSerializer",
        "configuration": {
            "mongoURI": "mongodb://localhost:27017/users-with-mongo",
        },
        "generate": [{
            "resource": "Users",
            "count": 5
        }]
    }]
}
*/

type ResourceGeneration = {
    resource: string,
    count: number,
};

type Action = {
    action: string,
    storageBackend: string,
    serializer?: string,
    configuration: any,
    generate: ResourceGeneration[],
};

type ResourceField = {
    name: string,
    type: string,
};

type Resource = {
    name: string,
    fieldName?: string,
    fields: ResourceField[],
};

type ConfigData = {
    resources: Resource[],
    actions: Action[],
};

function camelize(str: string) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}



class JSONConfig {
    data: string;

    constructor(data: string) {
        this.data = data;
    }

    generate(): string {
        const data: ConfigData = JSON.parse(this.data);

        // Determine serializer and any storage backends. These will only be
        // under the `actions` key in the config object.
        const knownSerializers: Set<string> = new Set<string>(),
            knownBackends: Set<string> = new Set<string>();
        
        for (const { serializer, storageBackend } of data.actions) {
            if (serializer) {
                knownSerializers.add(serializer);
            }
            knownBackends.add(storageBackend);
        }

        if (knownSerializers.size === 0) {
            knownSerializers.add('JSONSerializer');
        }

        const knownFields: Set<string> = new Set<string>();
        for (const resource of data.resources) {
            for (const { type } of resource.fields) {
                knownFields.add(type);
            }
        }

        let buffer = '';

        const imports: string[] = [
            ...knownBackends,
            ...knownSerializers,
            ...knownFields,
            'Generatable',
        ];

        // Generate the import prefices.
        buffer += `
import {
    ${imports.join(',\n    ')}
} from 'synthd';
`;

        // Generate resource type definitions.
        for (const resource of data.resources) {
            const fieldName = resource.fieldName ? resource.fieldName : camelize(resource.name);
            buffer += `
const ${resource.name} = Generatable('${fieldName}', [
    ${resource.fields.map((field) => {
        return `new ${field.type}('${field.name}')`
    }).join(',\n    ')}
]);
`;
        }

        // Create storage backend.

        // Run storage logic.


        return buffer;
    }

    run(): void {
        const fileData = this.generate();

        // Store in a temp file.

        // Run the file.

    }
}

interface Config {
    generate(): string
    run(): void
}

export default JSONConfig;