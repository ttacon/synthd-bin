import type {Argv} from 'yargs';


export const command: string = 'validate';
export const desc: string = 'Generates test data from a JSON file';

export function builder(yargs: Argv) {}

export async function handler(argv: Argv) {
    console.log('hello!');
    console.log(argv);
}