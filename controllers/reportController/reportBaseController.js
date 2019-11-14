const UniversalFunctions = require('../../utils/universalFunctions');
const async = require('async');
// eslint-disable-next-line no-unused-vars
const ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
// eslint-disable-next-line max-len
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const Service = require('../../services');

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: '2019-07-12',
    iam_apikey: '5dh6vU40y3jSYWyfEBBA_YwyTTC6R1rW010c5oMUNrzA',
    url: 'https://gateway-syd.watsonplatform.net/natural-language-understanding/api',
});
const toneAnalyzer = new ToneAnalyzerV3({
    version: '2016-05-19',
    iam_apikey: '-K7Vos3Es3H15ovZ57TyzA7Z1S62uGV869O241qEt9_P',
    url: 'https://gateway-syd.watsonplatform.net/tone-analyzer/api',
});

// const dbUrl = 'mongodb://solankip:unimelb3595@ds151997.mlab.com:51997/launchpad'
// var mongoose = require('mongoose')

// mongoose.model('document',{
//   text: String,
//   tone_analysis: Object,
//   nlu_analysis: Object,
//   timestamp: Date.now()
// })

const toneAnalysis = function (text, callback) {
    let testData;
    const toneParams = {
        tone_input: { 'text': text },
        content_type: 'application/json',
    };
    toneAnalyzer.tone(toneParams, function (err, data) {
        if (err) callback(err);
        else {
            testData = data;
            callback(null, { testData: testData });
        }
    });
};

const nLUAnalysis = function (text, callback) {
    let testData;
    const analyzeParams = {
        'text': text,
        'features': {
            'categories': {
                'limit': 3,
            },
            'concepts': {
                limit: 3,
            },
        },
    };

    naturalLanguageUnderstanding.analyze(analyzeParams, function (err, data) {
        if (err) callback(err);
        else {
            testData = data;
            callback(null, { testData: testData });
        }
    });
};


const createReport = function (payloadData, callback) {
    async.parallel({
        // create_user: function(cb) {
        //   // eslint-disable-next-line max-len
        //   Service.AnalysisService.createAnalysis({name: 'sadasfd', corpus: payloadData}, function(
        //       err,
        //       result
        //   ) {
        //     if (err) {
        //       cb(err);
        //     } else {
        //       cb(null, result);
        //     }
        //   });
        // },
        tone_analysis: function (cb) {
            toneAnalysis(payloadData, function (err, data) {
                cb(null, data);
            });
        },
        nLUAnalysis: function (cb) {
            nLUAnalysis(payloadData, function (err, data) {
                cb(null, data);
            });
        },
        // eslint-disable-next-line max-len
        // update_user: ['create_user', 'tone_analysis', 'nLUAnalysis', function(result, cb) {
        //   console.log('>>>>>>>>>>', result);
        //   // eslint-disable-next-line max-len
        //   Service.AnalysisService.updateAnalysis({'_id': result.create_user._id},
        //       {'tone_analysis': JSON.stringify(result.tone_analysis),
        //         'nlu_analysis': JSON.stringify(result.nLUAnalysis)},
        //       {},
        //       function(err, data) {
        //         console.log(err, data);
        //         cb(null, data);
        //       });
        // }],
    }, function (err, result) {
        return callback(null, result);
    });
};


module.exports = {
    createReport: createReport
};
