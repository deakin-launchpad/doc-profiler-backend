/**
 * Created by Navit
 */

'use strict';

var redis = {
    URI: process.env.MONGO_URI || "redis://"+process.env.REDIS_USER+":"+process.env.REDIS_PASS+"@"+process.env.REDIS_URL,
}

module.exports = {
    redis: redis
};



