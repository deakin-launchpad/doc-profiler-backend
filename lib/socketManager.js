'use strict';
/**
 * Created by Navit.
 */

var SocketIO = require('socket.io');
var TokenManager = require('./tokenManager');
var async = require("async");
var CONFIG = require("../config")
var ERROR = CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
var redisClient = require("../utils/redisConnect").redisClient;
var io;
exports.connectSocket = function (server) {
    io = SocketIO.listen(server.listener);

    console.log("socket server started");

    io.on('connection', function (socket) {
        console.log("connection established: ",socket.id);
        // setInterval((() => {socket.emit('message', {message: {type:'connection',statusCode:200,statusMessage:'WELCOME TO USER ONBOARDING MODULE',data:""}});}), 3000);
        socket.emit('message', {message: {type:'connection',statusCode:200,statusMessage:'WELCOME TO USER ONBOARDING MODULE',data:""}});

        socket.on('authenticate', function (userToken) {
            console.log(">>>>>>> authenticate request for user", userToken, socket.id);
            authenticateUser(userToken, socket,function (err, data) {
                console.log(err, data);
                if (err) io.in(socket.id).emit('message', { message: { type: 'INCORRECT_ACCESSTOKEN', statusCode: 403, statusMessage: 'Incorrect AccessToken', data: {} } })
                else io.in(socket.id).emit('message', { message: { type: 'authenticate', statusCode: 200, statusMessage: 'Success', data: data } })
            })
        })
    })
}

process.on("refreshContent", function (data) {
    io.in(data.socketId).emit("refreshContent", { message: { type: "refreshContent", statusCode: 200, statusMessage: "Success", data: data } });
});

process.on("refreshContentForError", function (data) {
    io.in(data.socketId).emit("refreshContentForError", { message: { type: "refreshContentForError", statusCode: 200, statusMessage: "Success", data: data } });
});

function authenticate(auth_token, callback) {
    TokenManager.verifyTokenSocket(auth_token, function (err, data) {
        if (err) callback(ERROR.INCORRECT_ACCESSTOKEN)
        else callback(null, data);
    })
}

function authenticateUser(userToken, socket, callback) {
    var userData;
    var saveObj;
    async.series([
        function (cb) {
            authenticate(userToken, function (err, data) {
                console.log(err,data)
                if (err) cb(err)
                else {
                    userData = data.userData
                    cb()
                }
            })
        },
        function (cb) {
            redisClient.hgetall(userData._id.toString(), function (err, obj) {
                if (obj) {
                    saveObj = obj;
                    saveObj.socketId = socket.id;
                    saveObj.userId = userData.id;
                }
                else {
                    saveObj = {
                        socketId: socket.id,
                        userId: userData.id
                    }
                }
                redisClient.hmset(userData._id.toString(), saveObj);
                cb()
            });
        }
    ], function (err, result) {
        if (err) callback(err)
        else callback(null, { redisData: saveObj })
    })
}