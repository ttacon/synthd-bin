import type {Argv} from 'yargs';


export const command: string = 'gen [validate]';
export const desc: string = 'Generates test data from a JSON file';

export function builder(yargs: Argv) {
    console.log('-----');
    console.log('gen base');
    return yargs
        .commandDir('gen-cmds')
        .demandCommand()
        .help();
};
