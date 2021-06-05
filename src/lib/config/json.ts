import { updateStrings } from 'yargs';
import { BackendInstantiation } from './backends';
import {
    Config,

    Action,
    ConfigData,
    Resource,
    ResourceField,
    ResourceGeneration,
} from './definitions';

import {
    BackendMap,
    importMode,
} from './utils';

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



function camelize(str: string) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}



export class JSONConfig {
    data: string;
    mode: string;

    constructor(data: string, mode?: string) {
        this.data = data;
        this.mode = mode || 'cjs';
    }

    generate(): string {
        const data: ConfigData = JSON.parse(this.data);

        const [importPreamble, modFunc] = importMode(this.mode);

        // Determine serializer and any storage backends. These will only be
        // under the `actions` key in the config object.
        const knownSerializers: Set<string> = new Set<string>(),
            knownBackends: Set<string> = new Set<string>(),
            backendActions: Map<string, Action[]> = new Map<string, Action[]>();
        
        for (const action of (data.actions || [])) {
            const { serializer, storageBackend } = action;
            if (serializer) {
                knownSerializers.add(serializer);
            }
            knownBackends.add(storageBackend);

            let backendAction = backendActions.get(storageBackend);
            if (!backendAction) {
                backendAction = [] as Action[];
                backendActions.set(storageBackend, backendAction);
            }
            backendAction.push(action);
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
${importPreamble} {
    ${imports.join(',\n    ')}
} ${modFunc('synthd')}
`;

        // Generate resource type definitions.
        for (const resource of data.resources) {
            const fieldName = resource.fieldName ? resource.fieldName : camelize(resource.name);
            buffer += `
const ${resource.name} = new Generatable('${fieldName}', [
    ${resource.fields.map((field) => {
        return `new ${field.type}('${field.name}')`
    }).join(',\n    ')}
]);
`;
        }

        // Create storage backend.
        let backendCodeImports = '',
            backendCodeInstantiations = '',
            backendPromises = '';
        for (const backend of knownBackends) {
            const instantiator = BackendMap.get(backend);
            if (!instantiator) continue;
    
            backendCodeImports += instantiator.importStatement();
            for (const action of backendActions.get(backend)!) {
                const backendName = action?.backendName || 'backend';
                backendCodeInstantiations += instantiator.generateInstantiation(
                    action.configuration,
                    backendName,
                );

                // Run storage logic.
                //
                // NOTE(ttacon): this straight up currently won't work for more than
                // one backend. Work on that once we're happy with supporting a single
                // backend properly.
                for (const {resource, collection, count} of action.generate) {
                    backendPromises += `
    ${backendName}.store('${collection}', ${resource}.generate(${count})),`;
                }
            }
        }

        buffer += "\n" + backendCodeImports;
        buffer += backendCodeInstantiations;


        if (backendPromises) {
            buffer += `
const finished = Promise.all([${backendPromises}
]);

finished.then(() => process.exit());
`;
        }

        return buffer;
    }

    run(): void {
        const fileData = this.generate();

        // Store in a temp file.

        // Run the file.

    }
}

export default JSONConfig;