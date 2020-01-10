const async = require('async');
var request = require("request");

const createReport = function (payloadData, callback) {
  var dataToSend;
  async.series({
    function (cb) {
      var formDATA = {
        "data": payloadData
      }
      request.post({ url: process.env.ANALYSE_SERVER + "/api/report/create", formData: formDATA }, function (err, response) {
        if (err)  {
          cb(err);
        } else {
          dataToSend = response.body;
          cb();
        }
      });
    }
  }, function (err, result) {
    if (err) callback(err);
    else return callback(null, dataToSend);
  });
};

module.exports = {
  createReport: createReport
};
