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


function CartDAO(database) {
    "use strict";

    this.db = database;


    this.getCart = function(userId, callback) {
        "use strict";

        this.db.collection("cart").findOne({ userId: userId }, function(err, doc) {
            assert.equal(null, err);
            callback(doc);
        });
    }


    this.itemInCart = function(userId, itemId, callback) {
        "use strict";

        this.db.collection("cart")
            .find({ userId: userId, "items._id": itemId }, { "items.$": 1 })
            .limit(1)
            .next(function (err, item) {
                assert.equal(null, err);
                if (item != null) {
                    item = item.items[0];
                }
                callback(item);
        });
    }


    /*
     * This solution is provide as an example to you of several query
     * language features that are valuable in update operations.
     * This method adds the item document passed in the item parameter to the
     * user's cart. Note that this solution works regardless of whether the
     * cart already contains items or is empty. addItem will be called only
     * if the cart does not already contain the item. The route handler:
     * router.post("/user/:userId/cart/items/:itemId"...
     * handles this. Please review how that method works to have a complete
     * understanding of how addItem is used.
     *
     * NOTE: One may use either updateOne() or findOneAndUpdate() to
     * write this method. We did not discuss findOneAndUpdate() in class,
     * but it provides a very straightforward way of solving this problem.
     * See the following for documentation:
     * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#findOneAndUpdate
     *
     */
    this.addItem = function(userId, item, callback) {
        "use strict";

        // Will update the first document found matching the query document.
        this.db.collection("cart").findOneAndUpdate(
            // query for the cart with the userId passed as a parameter.
            { userId: userId },
            // update the user's cart by pushing an item onto the items array
            { "$push": {items: item} },
            // findOneAndUpdate() takes an options document as a parameter.
            // Here we are specifying that the database should insert a cart
            // if one doesn't already exist (i.e. "upsert: true") and that
            // findOneAndUpdate() should pass the updated document to the
            // callback function rather than the original document
            // (i.e., "returnOriginal: false").
            {
                upsert: true,
                returnOriginal: false
            },
            // Because we specified "returnOriginal: false", this callback
            // will be passed the updated document as the value of result.
            function(err, result) {
                assert.equal(null, err);
                // To get the actual document updated we need to access the
                // value field of the result.
                callback(result.value);
            });
    };


    this.updateQuantity = function(userId, itemId, quantity, callback) {
        "use strict";

        var updateDoc = {};

        if (quantity == 0) {
            updateDoc = { "$pull": { items: { _id: itemId } } };
        } else {
            updateDoc = { "$set": { "items.$.quantity": quantity } };
        }

        this.db.collection("cart").findOneAndUpdate(
            { userId: userId, "items._id": itemId }, 
            updateDoc,
            { returnOriginal: false },
            function (err, result) {
                assert.equal(null, err);
                callback(result.value);
            });
    }
}


module.exports.CartDAO = CartDAO;
