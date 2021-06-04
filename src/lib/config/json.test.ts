import JSONConfig from './json';

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
            "count": 5
        }]
    }]
}`;

describe('JSONConfig', () => {
    it('should generate a single resource correctly', () => {
        const config = new JSONConfig(baseConfig);
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

const Users = Generatable('users', [
    new MongoObjectID('_id'),
    new FirstName('firstName'),
    new LastName('lastName'),
    new Email('email'),
    new PhoneNumber('phoneNumber')
]);
`);

    });

});