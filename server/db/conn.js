const { MongoClient } = require("mongodb");

const DB_NAME = "cinefile";

let client;
let _db;

module.exports = {
    // The client is built here rather than at module load so a missing
    // ATLAS_URI reports itself instead of throwing on require.
    connectToServer: async function () {
        const uri = process.env.ATLAS_URI;
        if (!uri) {
            throw new Error(
                "ATLAS_URI is not set. Copy server/config.env.example to server/config.env and fill it in."
            );
        }

        // useNewUrlParser and useUnifiedTopology are removed in driver v6.
        client = new MongoClient(uri);
        await client.connect();
        _db = client.db(DB_NAME);

        // Enforced by the database so two simultaneous registrations cannot
        // both pass a check and insert. Partial, so documents without a
        // userName are not treated as duplicates of each other.
        await _db.collection("userData").createIndex(
            { userName: 1 },
            { unique: true, partialFilterExpression: { userName: { $type: "string" } } }
        );

        console.log(`Connected to MongoDB database "${DB_NAME}".`);
        return _db;
    },

    // Undefined until connectToServer resolves. Callers must handle that.
    getDb: function () {
        return _db;
    },

    closeConnection: async function () {
        if (client) {
            await client.close();
            client = undefined;
            _db = undefined;
        }
    },
};
