'use strict';

var assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  aws = require('aws-sdk'),
  request = require('request'),
  config = require(path.resolve('./config/config')),
  util = require('util');

var MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
var MAX_FILE_CHUNK_BYTES = 5 * 1024 * 1024;

/**
 * FileUploader class used to upload (stream) a file from aws.s3 to twitter via:
 * - aws s3.getObject().createReadStream() and
 * - twitter /media/upload (chunked) API.
 * Usage:
 *   var fu = new FileUploader({ file: file }, oauth);
 *   fu.upload(function (err, res, body) {
 *     // use body to reference the media and post a tweet
 *   });
 *
 * @param  {Object}         params  Object of the form { file_path: String }.
 * @param  {Oauth(object)}  oauth   Oauth access object.
 */
var FileUploader = function (params, oauth) {
  assert(params);
  assert(params.file, 'Must specify `file.location` to upload a file. Got: ' + params.file.location + '.');
  var self = this;
  self._file = params.file;
  self._mediaFileSizeBytes = params.file.size; 
  self._oauth = oauth;
  self._isUploading = false;
  self._isFileStreamEnded = false;
};

/**
 * Stream a file from AWS S3 and upload it to Twitter via the /media/upload (chunked) API.
 *
 * @param  {Function} callback function (err, res, body)
 */
FileUploader.prototype.upload = function (callback) {
  var self = this;
  var s3 = new aws.S3({
    accessKeyId: config.aws.clientID,
    secretAccessKey: config.aws.clientSecret,
    region: config.aws.region,
    params: config.aws.params
  });
  
  // init media upload
  self._initMedia(function(err, res, body) {
    if (err) {
      callback(err);
    } else {
      var media_id_string = JSON.parse(body).media_id_string,
        chunkNumber = 0,
        s3GetObject = s3.getObject({
          Bucket: 'rbytr-test', 
          Key: self._file.key
        }).createReadStream();
      
      s3GetObject.on('readable', function() {
        /* jshint loopfunc:true */
        var chunk;
        while ((chunk = s3GetObject.read(MAX_FILE_CHUNK_BYTES))) {
          self._isUploading = true;
          // append to media upload
          self._appendMedia(media_id_string, chunk.toString('base64'), chunkNumber, function(err, res, body) {
            self._isUploading = false;
            if (err) {
              callback(err);
            } else {
              if (self._isUploadComplete()) {
                // We've hit the end of our stream; send FINALIZE command.
                self._finalizeMedia(media_id_string, callback);
              } else {
                // next chunk
                chunkNumber++;
              }
            }
          });
        }
      });
      
      s3GetObject.on('end', function() {
        // Mark our file streaming complete, and if done, send FINALIZE command.
        self._isFileStreamEnded = true;
        if (self._isUploadComplete()) {
          self._finalizeMedia(media_id_string, callback);
        }
      });
    }
  });
};

/**
 * Send INIT command for our underlying media object.
 *
 * @param  {Function} callback
 */
FileUploader.prototype._initMedia = function (callback) {
  var self = this;
  // Check the file size - it should not go over 15MB for video, 3MB for image.
  // See https://dev.twitter.com/rest/reference/post/media/upload-chunked
  if (self._mediaFileSizeBytes < MAX_FILE_SIZE_BYTES) {
    request.post({
      url: 'https://upload.twitter.com/1.1/media/upload.json',
      oauth: self._oauth,
      form: {
        command: 'INIT',
        media_type: self._file.mimetype,
        total_bytes: self._mediaFileSizeBytes
      }
    }, function (err, res, body) {
      if (err) {
        callback(err);
      } else {
        callback(null, res, body);
      }
    });
  } else {
    var errMsg = util.format('This file is too large. Max size is %dB. Got: %dB.', MAX_FILE_SIZE_BYTES, self._mediaFileSizeBytes);
    callback(new Error(errMsg));
  }
};

/**
 * Send APPEND command for media object with id `media_id`.
 * Append the chunk to the media object, then resume streaming our mediaFile.
 *
 * @param  {String}   media_id_string media_id_string received from Twitter after sending INIT command.
 * @param  {String}   chunk_part      Base64-encoded String chunk of the media file.
 * @param  {Number}   segment_index   Index of the segment.
 * @param  {Function} callback
 */
FileUploader.prototype._appendMedia = function (media_id_string, chunk_part, segment_index, callback) {
  var self = this;
  request.post({
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    oauth: self._oauth,
    form: {
      command: 'APPEND',
      media_id: media_id_string.toString(),
      segment_index: segment_index,
      media: chunk_part
    }
  }, function (err, res, body) {
    if (err) {
      callback(err);
    } else {
      callback(null, res, body);
    }
  });
};

/**
 * Send FINALIZE command for media object with id `media_id`.
 *
 * @param  {String}   media_id
 * @param  {Function} callback
 */
FileUploader.prototype._finalizeMedia = function (media_id, callback) {
  var self = this;
  request.post({
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    oauth: self._oauth,
    form: {
      command: 'FINALIZE',
      media_id: media_id
    }
  }, function (err, res, body) {
    if (err) {
      callback(err);
    } else {
      callback(null, res, body);
    }
  });
};

FileUploader.prototype._isUploadComplete = function () {
  return !this._isUploading && this._isFileStreamEnded;
};

module.exports = FileUploader;