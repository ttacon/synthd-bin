export function importMode(mode: string): [string, (modName:string) => string] {
    switch(mode) {
        case'esm':
            return [
                'import',
                (modName: string) =>  `from '${modName}';`
            ];
        case 'cjs':
        default:
            return [
                'const',
                (modName: string) => `= require('${modName}');`,
            ];
    }
}