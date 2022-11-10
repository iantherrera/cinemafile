const express = require("express");
const userDataRoutes = express.Router();
const dbObj = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

// Get user data
userDataRoutes.route("/userData").get(function (req, res) {
    let db_connect = dbObj.getDb("cinefile");
    db_connect
        .collection("userData")
        .find({})
        .toArray(function (err, result) {
            if (err) throw err;
            res.json(result);
        });
});

// Get a single record by id
userDataRoutes.route("/userData/:id").get(function (req, res) {
    let db_connect = dbObj.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    db_connect
        .collection("userData")
        .findOne(myquery, function (err, result) {
            if (err) throw err;
            res.json(result);
        });
});

// Create a new record.
userDataRoutes.route("/userData/add").post(function (req, response) {
    let db_connect = dbObj.getDb();
    let myobj = {
        /*      name: req.body.name,
                position: req.body.position,
                level: req.body.level, */
    };
    db_connect.collection("userData").insertOne(myobj, function (err, res) {
        if (err) throw err;
        response.json(res);
    });
});

// Update a record by id.
userDataRoutes.route("/update/:id").post(function (req, response) {
    let db_connect = dbObj.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    let newvalues = {
        $set: {
            /*          name: req.body.name,
                        position: req.body.position,
                        level: req.body.level, */
        },
    };
    db_connect
        .collection("userData")
        .updateOne(myquery, newvalues, function (err, res) {
            if (err) throw err;
            console.log("1 document updated");
            response.json(res);
        });
});

// Delete a record.
userDataRoutes.route("/:id").delete((req, response) => {
    let db_connect = dbObj.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    db_connect.collection("userData").deleteOne(myquery, function (err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        response.json(obj);
    });
});

module.exports = userDataRoutes;