var redis = require('redis');

var redisClient = redis.createClient(process.env.REDIS_PORT);
//Starting redis Server

redisClient.on('error', function (err) {
    console.log("Redis Connection Error : ", err);
    redisClient.on('connect', function () {
        console.log('Redis Connected');
    });
});

redisClient.on('ready', function () {
    console.log('redis is running');
});

/*
redisClient.on('connect', function() {
    console.log('Redis Connected');
});
*/

exports.redisClient = redisClient