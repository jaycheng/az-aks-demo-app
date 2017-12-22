/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";

        // define the aggregation pipeline
        var pipeline = [
            { $group: { _id: "$category", 
                        num: { $sum: 1 } 
                      } },
            { $sort: { _id: 1 } }
        ];

        this.db.collection("item").aggregate(pipeline).toArray(function (err, categories) {
            assert.equal(null, err);

            var total = 0;
            for (var i = 0; i < categories.length; i++) {
                total += categories[i].num;
            }

            categories.unshift({ _id: "All", num: total });

            callback(categories);
        });
    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";

        var queryDoc = {};

        if (category !== "All") {
            queryDoc = { category: category };
        }

        var cursor = this.db.collection("item").find(queryDoc);
        cursor.sort({ _id: 1 })
            .skip(page * itemsPerPage)
            .limit(itemsPerPage)
            .toArray(function (err, pageItems) {
                assert.equal(null, err);
                callback(pageItems);
            });
    }


    this.getNumItems = function(category, callback) {
        "use strict";

        var queryDoc = {};

        if (category !== "All") {
            queryDoc = { category: category };
        }

        this.db.collection("item").find(queryDoc).count(function (err, count) {
            assert.equal(null, err);
            callback(count);
        });
    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        var queryDoc = {};
        
        if (query.trim() !== "") {
            queryDoc = { $text: { $search: query } };
        }

        this.db.collection("item").find(queryDoc)
            .sort({ _id: 1 })
            .skip(page * itemsPerPage)
            .limit(itemsPerPage)
            .toArray(function (err, pageItems) {
                assert.equal(null, err);
                callback(pageItems);
            });
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        var queryDoc = {};
        
        if (query.trim() !== "") {
            queryDoc = { $text: { $search: query } };
        }

        this.db.collection("item").find(queryDoc)
            .count(function (err, count) {
                assert.equal(null, err);
                callback(count);
            });
    }


    this.getItem = function(itemId, callback) {
        "use strict";

        this.db.collection("item").findOne({ _id: itemId }, function (err, item) {
            assert.equal(null, err);
            callback(item);
        });
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        };

        this.db.collection("item").updateOne(
            { _id: itemId },
            { $push: { reviews: reviewDoc } }, 
            function (err, result) {
                assert.equal(null, err);
                callback(result);
            });
    }
}


module.exports.ItemDAO = ItemDAO;
