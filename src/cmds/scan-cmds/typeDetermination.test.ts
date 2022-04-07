import determineType from './typeDetermination';


type TestCase = {
    testName: string;
    value: string;
    field: string;
    expectedType: string;
}

describe('determineType', () => {
    describe('firstName', () => {
        const tests: TestCase[] = [{
            testName: 'lower camel case',
            value: 'firstName',
            field: 'varchar(55)',
            expectedType: 'firstName',
        }, {
            testName: 'upper camel case',
            value: 'FirstName',
            field: 'varchar(55)',
            expectedType: 'firstName',
        }, {
            testName: 'dash split',
            value: 'first-name',
            field: 'varchar(55)',
            expectedType: 'firstName',
        }, {
            testName: 'underscore split',
            value: 'first_name',
            field: 'varchar(55)',
            expectedType: 'firstName',
        }, {
            testName: 'space split',
            value: 'first name',
            field: 'varchar(55)',
            expectedType: 'firstName',
        }];

        tests.forEach(({testName, value, field, expectedType}) => {
            it(`correctly handles a ${value} in ${testName}`, () => {
                const determinedType = determineType(value, field);
                expect(determinedType).toEqual(expectedType);
            });
        });
    });

    describe('lastName', () => {
        const tests: TestCase[] = [{
            testName: 'lower camel case',
            value: 'lastName',
            field: 'varchar(55)',
            expectedType: 'lastName',
        }, {
            testName: 'upper camel case',
            value: 'LastName',
            field: 'varchar(55)',
            expectedType: 'lastName',
        }, {
            testName: 'dash split',
            value: 'last-name',
            field: 'varchar(55)',
            expectedType: 'lastName',
        }, {
            testName: 'underscore split',
            value: 'last_name',
            field: 'varchar(55)',
            expectedType: 'lastName',
        }, {
            testName: 'space split',
            value: 'last name',
            field: 'varchar(55)',
            expectedType: 'lastName',
        }];

        tests.forEach(({testName, value, field, expectedType}) => {
            it(`correctly handles a ${value} in ${testName}`, () => {
                const determinedType = determineType(value, field);
                expect(determinedType).toEqual(expectedType);
            });
        });
    });

        describe('lastName', () => {
        const tests: TestCase[] = [{
            testName: 'specific datetime',
            value: 'createdAt',
            field: 'datetime',
            expectedType: 'date',
        }];

        tests.forEach(({testName, value, field, expectedType}) => {
            it(`correctly handles a ${value} in ${testName}`, () => {
                const determinedType = determineType(value, field);
                expect(determinedType).toEqual(expectedType);
            });
        });
    });
});
