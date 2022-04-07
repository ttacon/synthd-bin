import type {Argv} from 'yargs';


export const command: string = 'scan [import]';
export const desc: string = 'Scans in schema from storage engines';

export function builder(yargs: Argv) {
    return yargs
        .commandDir('scan-cmds', {
            exclude: /\.test\.js/,
        })
        .demandCommand()
        .help();
};
