import JSONConfig from './json';

const resourceOnlyConfig = `{
    "resources": [{
        "name": "Users",
        "fieldName": "users", 
        "fields": [{
            "name": "_id",
            "type": "MongoObjectID"
        }, {
            "name": "firstName",
            "type": "FirstName"
        }, {
            "name": "lastName",
            "type": "LastName"
        }, {
            "name": "email",
            "type": "Email"
        }, {
            "name": "phoneNumber",
            "type": "PhoneNumber"
        }]
    }]
}`;


const baseConfig = `{
    "resources": [{
        "name": "Users",
        "fieldName": "users", 
        "fields": [{
            "name": "_id",
            "type": "MongoObjectID"
        }, {
            "name": "firstName",
            "type": "FirstName"
        }, {
            "name": "lastName",
            "type": "LastName"
        }, {
            "name": "email",
            "type": "Email"
        }, {
            "name": "phoneNumber",
            "type": "PhoneNumber"
        }]
    }],
    "actions": [{
        "action": "generateAndStore",
        "storageBackend": "MongoistBackend",
        "serializer": "JSONSerializer",
        "configuration": {
            "mongoURI": "mongodb://localhost:27017/users-with-mongo"
        },
        "generate": [{
            "resource": "Users",
            "collection": "users",
            "count": 5
        }]
    }]
}`;

const linkedSessionConfig = `{
    "resources": [{
        "name": "Users",
        "fieldName": "users", 
        "fields": [{
            "name": "_id",
            "type": "MongoObjectID"
        }, {
            "name": "firstName",
            "type": "FirstName"
        }, {
            "name": "lastName",
            "type": "LastName"
        }, {
            "name": "email",
            "type": "Email"
        }, {
            "name": "phoneNumber",
            "type": "PhoneNumber"
        }]
    }, {
        "name": "Sessions",
        "fieldName": "sessions",
        "fields": [{
            "name": "_id",
            "type": "MongoObjectID"
        }, {
            "name": "ip",
            "type": "IPAddress"
        }, {
            "name": "userID",
            "type": "LinkedField",
            "config": {
                "linkage": {
                    "obj": "Users",
                    "field": "_id"
                }
            },
            "options": {
                "obj": "Users",
                "field": "_id"
            }
        }]
    }],
    "actions": [{
        "action": "generateAndStore",
        "storageBackend": "MongoistBackend",
        "serializer": "JSONSerializer",
        "configuration": {
            "mongoURI": "mongodb://localhost:27017/users-with-mongo"
        },
        "generate": [{
            "resource": "Users",
            "collection": "users",
            "count": 5
        }, {
            "resource": "Sessions",
            "collection": "sessions",
            "count": 20
        }]
    }]
}`;

describe('JSONConfig', () => {
    describe('generate', () => {
        it('should generate a single resource correctly', () => {
            const config = new JSONConfig(resourceOnlyConfig, 'esm');
            const generated = config.generate();

            expect(generated).toEqual(`
import {
    JSONSerializer,
    MongoObjectID,
    FirstName,
    LastName,
    Email,
    PhoneNumber,
    Generatable
} from 'synthd';

const Users = new Generatable('users', [
    new MongoObjectID('_id'),
    new FirstName('firstName'),
    new LastName('lastName'),
    new Email('email'),
    new PhoneNumber('phoneNumber'),
]);

`);
        });

        it('should generate a basic config correctly', () => {
            const config = new JSONConfig(baseConfig, 'esm');
            const generated = config.generate();

            expect(generated).toEqual(`
import {
    MongoistBackend,
    JSONSerializer,
    MongoObjectID,
    FirstName,
    LastName,
    Email,
    PhoneNumber,
    Generatable
} from 'synthd';

const Users = new Generatable('users', [
    new MongoObjectID('_id'),
    new FirstName('firstName'),
    new LastName('lastName'),
    new Email('email'),
    new PhoneNumber('phoneNumber'),
]);

import mongoist from 'mongoist';
const db = mongoist('mongodb://localhost:27017/users-with-mongo');

const backend = new MongoistBackend(db);
const finished0 = Promise.all([
    backend.store('users', Users.generate(5)),
]);

Promise.all([ finished0 ]).then(() => process.exit());
`);

        });

        it('should generate a basic config correctly', () => {
            const config = new JSONConfig(linkedSessionConfig, 'esm');
            const generated = config.generate();

            expect(generated).toEqual(`
import {
    MongoistBackend,
    JSONSerializer,
    MongoObjectID,
    FirstName,
    LastName,
    Email,
    PhoneNumber,
    IPAddress,
    LinkedField,
    Generatable
} from 'synthd';

const Users = new Generatable('users', [
    new MongoObjectID('_id'),
    new FirstName('firstName'),
    new LastName('lastName'),
    new Email('email'),
    new PhoneNumber('phoneNumber'),
]);

const Sessions = new Generatable('sessions', [
    new MongoObjectID('_id'),
    new IPAddress('ip'),
    new LinkedField('userID', {
        obj: 'Users',
        field: '_id',
    }),
]);

import mongoist from 'mongoist';
const db = mongoist('mongodb://localhost:27017/users-with-mongo');

const backend = new MongoistBackend(db);
const finished0 = Promise.all([
    backend.store('users', Users.generate(5)),
]);

const finished1 = Promise.all([
    backend.store('sessions', Sessions.generate(20)),
]);

Promise.all([ finished0, finished1 ]).then(() => process.exit());
`);

        });
    });

    describe('identifyResourceDependencies', () => {
        it('should handle independent resources', () => {
            const config = new JSONConfig('');
            const levels = config.identifyResourceDependencies([{
                name: 'Foo',
                fieldName: 'foo',
                fields: [{
                    name: '_id',
                    type: 'MongoObjectID',
                }],
            }, {
                name: 'Bar',
                fieldName: 'bar',
                fields: [{
                    name: '_id',
                    type: 'MongoObjectID',
                }],
            }]);

            expect(levels.length).toEqual(1);
            expect(levels[0].length).toEqual(2);
        });

        it('should handle a chain of resources', () => {
            const config = new JSONConfig('');
            const levels = config.identifyResourceDependencies([{
                name: 'Foo',
                fieldName: 'foo',
                fields: [{
                    name: '_id',
                    type: 'MongoObjectID',
                }],
            }, {
                name: 'Bar',
                fieldName: 'bar',
                fields: [{
                    name: '_id',
                    type: 'MongoObjectID',
                }, {
                    name: 'fooID',
                    type: 'LinkedField',
                    config: {
                        linkage: {
                            obj: 'Foo',
                            field: '_id',
                        }
                    }
                }],
            }, {
                name: 'Baz',
                fieldName: 'baz',
                fields: [{
                    name: '_id',
                    type: 'MongoObjectID',
                }, {
                    name: 'barID',
                    type: 'LinkedField',
                    config: {
                        linkage: {
                            obj: 'Bar',
                            field: '_id',
                        }
                    }
                }],
            }]);

            expect(levels.length).toEqual(3);
            expect(levels[0].length).toEqual(1);
            expect(levels[1].length).toEqual(1);
            expect(levels[2].length).toEqual(1);
        });
    });

    it('should handle a bifurcating tree of resources', () => {
        const config = new JSONConfig('');
        const levels = config.identifyResourceDependencies([{
            name: 'Foo',
            fieldName: 'foo',
            fields: [{
                name: '_id',
                type: 'MongoObjectID',
            }],
        }, {
            name: 'Bar',
            fieldName: 'bar',
            fields: [{
                name: '_id',
                type: 'MongoObjectID',
            }, {
                name: 'fooID',
                type: 'LinkedField',
                config: {
                    linkage: {
                        obj: 'Foo',
                        field: '_id',
                    }
                }
            }],
        }, {
            name: 'Baz',
            fieldName: 'baz',
            fields: [{
                name: '_id',
                type: 'MongoObjectID',
            }, {
                name: 'fooID',
                type: 'LinkedField',
                config: {
                    linkage: {
                        obj: 'Foo',
                        field: '_id',
                    }
                }
            }],
        }, {
            name: 'Qux',
            fieldName: 'qux',
            fields: [{
                name: '_id',
                type: 'MongoObjectID',
            }, {
                name: 'barID',
                type: 'LinkedField',
                config: {
                    linkage: {
                        obj: 'Bar',
                        field: '_id',
                    }
                }
            }],
        }, {
            name: 'Quux',
            fieldName: 'quux',
            fields: [{
                name: '_id',
                type: 'MongoObjectID',
            }, {
                name: 'barID',
                type: 'LinkedField',
                config: {
                    linkage: {
                        obj: 'Bar',
                        field: '_id',
                    }
                }
            }],
        }, {
            name: 'Quuz',
            fieldName: 'quuz',
            fields: [{
                name: '_id',
                type: 'MongoObjectID',
            }, {
                name: 'bazID',
                type: 'LinkedField',
                config: {
                    linkage: {
                        obj: 'Baz',
                        field: '_id',
                    }
                }
            }],
        }, {
            name: 'Corge',
            fieldName: 'corge',
            fields: [{
                name: '_id',
                type: 'MongoObjectID',
            }, {
                name: 'bazID',
                type: 'LinkedField',
                config: {
                    linkage: {
                        obj: 'Baz',
                        field: '_id',
                    }
                }
            }],
        }]);

        expect(levels.length).toEqual(3);
        expect(levels[0].length).toEqual(1);
        expect(levels[1].length).toEqual(2);
        expect(levels[2].length).toEqual(4);
    }); 
});