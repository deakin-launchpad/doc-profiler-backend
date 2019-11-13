/**
 * Created by Navit
 */

'use strict';

var mongo = {
    URI: process.env.MONGO_URI || 'mongodb://localhost/doc-profiler-backend',
    // URI: process.env.MONGO_URI || 'mongodb://mongo:27017/doc-profiler-backend', //for docker
    //URI: process.env.MONGO_URI || "mongodb://"+process.env.MONGO_USER+":"+process.env.MONGO_PASS+"@localhost/"+process.env.MONGO_DBNAME_DEV,
    port: 27017
};

module.exports = {
    mongo: mongo
};



