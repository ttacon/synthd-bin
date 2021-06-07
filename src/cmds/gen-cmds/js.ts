import type {
    Argv,
} from 'yargs';

import * as fs from 'fs';

import {
    JSONConfig,
} from '../../lib/config';

export const command: string = 'js';
export const desc: string = 'Generates a valid node script that uses synthd from a JSON file';

export function builder(yargs: Argv) {
    return yargs.options({
        file: {
            describe: 'The JSON file to generate the JS file from.',
            type: 'string',
        },
        mode: {
            describe: 'The JS module mode.',
            type: 'string',
        },
        output: {
            describe: 'Where the generate file should be output to. Input will be considered as a filename, unless `stdout` is provided.',
            type: 'string',
        }
      });
}

type HandlerArguments = {
    file: string,
    mode: string,
    output: string,
};

export async function handler(argv: HandlerArguments) {
    const { file, mode, output } = argv;
    if (!file) {
        throw new Error('must provide file');
    }

    const rawFileData = fs.readFileSync(file);
    const config = new JSONConfig(rawFileData.toString(), {
        file,
        mode,
    });
    const generatedData = config.generate();

    if (!output || output === 'stdout') {
        console.log(generatedData);
        return;
    }

    fs.writeFileSync(output, generatedData);

    console.log(`output written to ${output}`);
}