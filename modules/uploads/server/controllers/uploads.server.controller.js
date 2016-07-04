'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  aws = require('aws-sdk'),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * AWS incoming files
 */
exports.handleAWS = function (req, res) {
  var s3 = new aws.S3({
    accessKeyId: config.aws.clientID,
    secretAccessKey: config.aws.clientSecret,
    region: config.aws.region,
    params: config.aws.params
  });
  
  var upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'rbytr-test',
      acl: 'public-read',
      key: function (req, file, cb) {
        var filename = file.originalname.split('.')[0];
        var ext = file.mimetype.split('/')[1];
        cb(null, filename + '-' + Date.now() + '.' + ext);
      }
    })
  }).array('files');
  
  var postUploadFileFilter = require(path.resolve('./config/lib/multer')).postUploadFileFilter;
  upload.fileFilter = postUploadFileFilter;
  
  if (req.user) {
    upload(req, res, function (uploadError) {
      if (uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading file'
        });
      } else {
        res.json(req.files);
      }
    });
  }
};

/**
 * Handle incoming files
 */
exports.handle = function (req, res) {
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './modules/uploads/client/files/');
    },
    filename: function (req, file, cb) {
      var filename = file.originalname.split('.')[0];
      var ext = file.mimetype.split('/')[1];
      cb(null, filename + '-' + Date.now() + '.' + ext);
    }
  });
  var upload = multer({ storage: storage }).array('files');
  var postUploadFileFilter = require(path.resolve('./config/lib/multer')).postUploadFileFilter;
  
  upload.fileFilter = postUploadFileFilter;
  
  if (req.user) {
    upload(req, res, function (uploadError) {
      if (uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading file'
        });
      } else {
        res.json(req.files);
      }
    });
  }
};