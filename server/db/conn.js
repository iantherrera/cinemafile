const { MongoClient } = require("mongodb");

const DB_NAME = "cinefile";

let client;
let _db;

module.exports = {
    // Connects once at startup. The client is built here rather than at module
    // load so a missing ATLAS_URI produces a clear message instead of throwing
    // on require.
    connectToServer: async function () {
        const uri = process.env.ATLAS_URI;
        if (!uri) {
            throw new Error(
                "ATLAS_URI is not set. Copy server/config.env.example to server/config.env and fill it in."
            );
        }

        // useNewUrlParser and useUnifiedTopology were no-ops in driver v4 and
        // are removed in v6, so they are not passed.
        client = new MongoClient(uri);
        await client.connect();
        _db = client.db(DB_NAME);
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
