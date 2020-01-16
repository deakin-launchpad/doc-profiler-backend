/**
 * Created by Navit
 */

'use strict';

var redis = {
    URI: process.env.MONGO_URI || "redis://"+process.env.REDIS_USER+":"+process.env.REDIS_PASS+"@88ed82db-e210-483e-91b2-ce22ef8b1d0d.22868e325a8b40b6840ed9895f3bb023.databases.appdomain.cloud:32331/0",
};

module.exports = {
    redis: redis
};



