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
} from './utils';

import {
    importMode,
} from './genUtils';

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

    identifyResourceDependencies(resources: Resource[]): string[][] {
        const levels: string[][] = [];

        type DependencyNode = {
            resource: string,
            dependencies: DependencyNode[],
        };
        type DelayedLink = {
            dependentOn: string,
            depNode: DependencyNode,
        };
        const depMap = new Map<string, DependencyNode>(),
            delayedLinks = new Set<DelayedLink>(),
            topLevelNodes = new Set<string>();
        for (const resource of resources) {
            const newDepNode = {
                resource: resource.name,
                dependencies: [],  
            };
            topLevelNodes.add(resource.name);
            depMap.set(resource.name, newDepNode);

            for (const { type, config } of resource.fields) {
                if (type !== 'LinkedField' || !config) {
                    continue;
                }

                const { linkage: { obj } } = config;
                const dependentNode = depMap.get(obj);
                if (!dependentNode) {
                    delayedLinks.add({
                        dependentOn: obj,
                        depNode: newDepNode,
                    });
                } else {
                    dependentNode.dependencies.push(newDepNode);
                }
                topLevelNodes.delete(resource.name);
            }
        }

        for (const { depNode, dependentOn } of delayedLinks) {
            if (!depMap.has(dependentOn)) {
                // DIDNTDO(ttacon): Report error.
                continue;
            }

            depMap.get(dependentOn)?.dependencies.push(depNode);
        }

        // There is a possible world where we have some circular dependencies,
        // but we don't support that use case at the moment. As such, we can
        // assume that there will be at least one top-level resource.
        for (const topLevelNode of topLevelNodes) {
            let currLevel = 0,
                moreLevels = true,
                currResources = [topLevelNode];

            while (moreLevels) {
                const nextResources = [];
                for (const resource of currResources) {
                    // Store the current resource at the right level.
                    if (levels.length <= currLevel) {
                        for (let i = levels.length; i<=currLevel; i++) {
                            levels.push([]);
                        }
                    }
                    levels[currLevel].push(resource);

                    // Build the next level of resources to look at.
                    const depNode = depMap.get(resource)!;
                    for (const dep of depNode.dependencies) {
                        nextResources.push(dep.resource);
                    }
                }

                // Prep for the next level, if there is one.
                currLevel++;
                currResources = nextResources;
                moreLevels = nextResources.length > 0;
            }
        }

        return levels;
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
        let optsBuffer = '';
        if (field.options) {
            const opts = Object.keys(field.options).map((k) => {
                if (field.type === 'LinkedField' && k === 'obj') {
                    return `        ${k}: ${field.options[k]}`;
                }
                return `        ${k}: '${field.options[k]}'`;
            });
            optsBuffer = `, {
${opts.join(',\n')},
    }`;
               
        }
        return `new ${field.type}('${field.name}'${optsBuffer})`
    }).join(',\n    ')},
]);
`;
        }

        // Create storage backend.
        let backendCodeImports = '',
            backendCodeInstantiations = '',
            backendPromises = new Map<string, string>();
        for (const backend of knownBackends) {
            const instantiator = BackendMap.get(backend);
            if (!instantiator) continue;
    
            backendCodeImports += instantiator.importStatement(this.mode);
            for (const action of backendActions.get(backend)!) {
                const backendName = action?.backendName || 'backend';
                backendCodeInstantiations += instantiator.generateInstantiation(
                    action.configuration,
                    backendName,
                );

                // Run storage logic.
                for (const {resource, collection, count} of action.generate) {
                    backendPromises.set(resource, `
        ${backendName}.store('${collection}', ${resource}.generate(${count})),`);
                }
            }
        }

        buffer += "\n" + backendCodeImports;
        buffer += backendCodeInstantiations;

        const levels = this.identifyResourceDependencies(data.resources);

        if (backendPromises.size) {
            let storagePromiseBuf = '';
            const finishPromisesToAwait = [];
            for (let i=0; i < levels.length; i++) {
                const level = levels[i];
                const levelPromises = level.map((resource) => {
                    return backendPromises.get(resource);
                });
                storagePromiseBuf += `
    await Promise.all([${levelPromises}
    ]);
`;
             }

            buffer += `
async function runStorage() {
${storagePromiseBuf}
}`;
            buffer += `
runStorage().then(() => process.exit());
`;
        }

        return buffer;
    }
}

export default JSONConfig;