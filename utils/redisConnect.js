var redis = require('redis');
var CONFIG = require('../config')

var fs = require('fs');

var path = require('path');
var appDir = path.dirname(require.main.filename);

var certificate = (fs.readFileSync(`${appDir}/certs/redis_certificate.crt`)).toString();

const ca = Buffer.from(certificate, 'base64').toString('utf-8')

var tls = {ca}

var redisClient = redis.createClient(CONFIG.REDIS_CONFIG.redis.URI,{tls});
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