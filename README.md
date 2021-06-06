synthd-bin
=====
`synthd` is a CLI utility for generating test data and storing it in your
backend of choice (e.g. mongo, ES, MySQL, Postgres, etc).

The main reason to use the `synthd` CLI is to be able to generate test data and
store it in your backend, all from JSON files.


## Installation
To install `synthd` as a CLI, assuming that you have node installed, you can
do:

```sh
npm i -g synthd-bin
```

## Usage

### Basic example
Let's run through a first basic example of generating a document of a single type and storing it in a Mongo collection. Given this JSON file named `basic.json`:

```json
{
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
}
```

You could then run:

```sh
synthd gen run --file basic.json
```

Assuming you had a passwordless Mongo DB listening locally on the default Mongo port (`27017`), you'll see five documents in the `users` collection in the `users-with-mongo` DB. To check:

```sh
# In your shell connect to Mongo.
mongo

# Check for the desired documents.
use users-with-mongo
db.users.find({})
```

## Future

`synthd` is a quickly moving target at the moment, but we'll do our best to follow semver appropriately and try to document any migration notes as needed between major versions.

The next major areas that we're looking to develop in, and feel free to contribue to are:

 - [ ] Schema inference (e.g. `synthd` can generate scenario files from your DB by sampling documents).
 - [ ] Schema reuse (e.g. you can include or import a common set of resource definitions).
 - [ ] More complicated data generation scenarios (e.g. different weights for different data types).