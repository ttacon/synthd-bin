import * as fs from 'fs';
import * as path from 'path';

import {
    ConfigData,
    LocalFileResourceReference,
    Resource,
} from './definitions';


type ResourceResolver = {
    resolveReference(
        resource: Resource,
        file: string,
    ): Resource|undefined,
};

class LocalFileResolver {
    resourceCache: Map<string, Resource> = new Map<string, Resource>();
    resolvedFiles: Set<string> = new Set<string>();

    resolveReference(resource: Resource, file: string): Resource|undefined {
        // Identify the file name.
        const { path: configPath } = resource.reference?.config as LocalFileResourceReference;

        // If we know it, return early.
        if (this.resolvedFiles.has(configPath)) {
            return this.resourceCache.get(resource.name);
        }

        // Load the file and parse the resources.
        const resolvedPath = path.join(
            path.dirname(file),
            configPath,
        );
        const data = JSON.parse(fs.readFileSync(resolvedPath).toString()) as ConfigData;

        // Save the resources and mark the file as known.
        for (const resource of data.resources) {
            this.resourceCache.set(resource.name, resource);
        }
        this.resolvedFiles.add(configPath);

        // Return the resources.
        return this.resourceCache.get(resource.name);
    }
}

export const resolverMap = new Map<string, ResourceResolver>();
resolverMap.set('file:local', new LocalFileResolver());