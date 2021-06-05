/**
 * We have one type that we need all backends to support - 
 * the generation of any code preamble.
 */

export interface BackendInstantiation {
    generateInstantiation(data: any): string
    importStatement(): string
}


