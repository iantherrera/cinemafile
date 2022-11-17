const express = require("express");
const userDataRoutes = express.Router();
const dbObj = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

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

// Update user's movie data by id.
userDataRoutes.route("/update/:id").post(function (req, response) {
    let db_connect = dbObj.getDb();
    let myquery = { _id: ObjectId(req.params.id) };
    let newvalues = {
        $set: {
            movieData: req.body.movieData,
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

module.exports = userDataRoutes;