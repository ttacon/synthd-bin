export const firstName = [
    /first[^a-zA-Z0-9]*name/,
];

export const lastName = [
    /last[^a-zA-Z0-9]*name/,
];

export const name = [
    /name/,
];

export const ipAddress = [
    /ip[^a-zA-Z0-9]*addr/,
];

const validators: { [key:string]: RegExp[] } = {
    firstName,
    lastName,
    name,
    ipAddress,
};

const dateTypes = [
    'datetime',
];

export default function determineType(fieldName: string, field: string): string {
    if (dateTypes.indexOf(field) > -1) {
        return 'date';
    }

    fieldName = fieldName.toLocaleLowerCase();
    for (const name in validators) {
        const validator: RegExp[] = validators[name];
        for (const check of validator) {
            if (check.test(fieldName)) {
                return name;
            }
        }
    }
    return 'string';
};
