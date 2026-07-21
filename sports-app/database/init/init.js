// Runs once, automatically, the first time the mongo container starts with
// an empty data directory (see docker-entrypoint-initdb.d in the Mongo
// image docs). Runs against MONGO_INITDB_DATABASE.
db.users.createIndex({ email: 1 }, { unique: true });
