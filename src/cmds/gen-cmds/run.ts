import type {
    Argv,
} from 'yargs';

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import * as shelljs from 'shelljs';

import {
    JSONConfig,
} from '../../lib/config';

export const command: string = 'run';
export const desc: string = 'Runs a synthd scenario from a given JSON file.';

export function builder(yargs: Argv) {
    return yargs.options({
        file: {
            describe: 'The JSON file to run the synthd scenario from.',
            type: 'string',
        },
        mode: {
            describe: 'The JS module mode.',
            type: 'string',
        }
      });
}

type HandlerArguments = {
    file: string,
    mode: string,
};

function tmpDir(): string {
    const platformTmpDir = shelljs.tempdir();

    const tempDir = path.join(
        platformTmpDir,
        'synthd',
        crypto.randomBytes(32).toString('hex'),
    );

    shelljs.mkdir('-p', tempDir);

    return tempDir;
}

function hashedFile(data: string): string {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return hash.digest().toString('hex');
}

export async function handler(argv: HandlerArguments) {
    const { file, mode } = argv;
    if (!file) {
        throw new Error('must provide file');
    }

    const rawFileData = fs.readFileSync(file);
    const config = new JSONConfig(rawFileData.toString(), {
        file,
        mode,
    });
    const generatedData = config.generate();

    const storageDir = tmpDir();
    const fileName = hashedFile(generatedData);


    const scriptPath = path.join(
        storageDir,
        fileName,
    );
    fs.writeFileSync(scriptPath, generatedData);

    const shelljsOpts = {
        cwd: storageDir,
        silent: true,
    };

    console.log('generating skeleton for running synthd scenario');
    shelljs.exec('npm init -y', shelljsOpts);

    console.log('installing required dependencies');
    shelljs.exec('npm i synthd mongoist @elastic/elasticsearch', shelljsOpts);

    console.log('running synthd scenario');
    shelljs.exec(`node ${scriptPath}`, shelljsOpts);
}