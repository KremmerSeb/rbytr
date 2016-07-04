'use strict';
var _ = require('lodash'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  config = require(path.resolve('./config/config')),
  Post = mongoose.model('Post'),
  FileUploader = require('../uploaders/uploaders.twitter-aws.server.controller'),
  request = require('request');

var twitter = {
  create : {
    post : function (post, callback) {
      twitter.getOauth(post.user, function (err, oauth) {    
        if (err) {    
          callback(err);
        } else {
          request.post({
            url: 'https://api.twitter.com/1.1/statuses/update.json',
            oauth: oauth,
            form: {
              status: post.content
            }
          }, function (err, res, body) {
            if (err) {
              callback(err);
            }
            body = JSON.parse(body);
            if (res.statusCode === 200 && body.hasOwnProperty('id_str')) {
              callback(null, body);
            }
          });
        }
      });
    },
    /**
     * Post with media
     */
    postWithMedia : function (post, callback) {
      var file = post.files[0];
      twitter.getOauth(post.user, function (err, oauth) {
        if (err) {
          callback(err);
        } else {
          // file upload
          var fileUpload = new FileUploader({ file: file }, oauth);
          fileUpload.upload(function (err, res, body) {
            var media_id_string = JSON.parse(body).media_id_string.toString(),
              status = post.content,
              meta_params = {
                media_id: media_id_string,
                alt_text: {
                  text: status
                }
              };
            
            // reference the media and post a tweet
            var params = {
              status: status,
              media_ids: media_id_string
            };
            request.post({
              url: 'https://api.twitter.com/1.1/statuses/update.json',
              oauth: oauth,
              form: params
            }, function (err, res, body) {
              body = JSON.parse(body);
              if (res.statusCode === 200 && body.hasOwnProperty('id_str')) {
                callback(null, body);
              }
            });
          });
        }
      });
    },
    engagement : {
      likes : function (post, user, callback) {
        twitter.getOauth(user, function (err, oauth) {  
          if (err) {    
            callback(err);
          } else {
            request.post({
              url: 'https://api.twitter.com/1.1/favorites/create.json',
              oauth: oauth,
              form: {
                id: post.targets.twitter.id
              }
            }, function (err, res, body) {
              if (err) {
                callback(err);
              }
              body = JSON.parse(body);
              if (res.statusCode === 200 && body.hasOwnProperty('id_str')) {
                return callback(null, body);
              }
            });
          }
        });
      },
      shares : function (post, user, callback) {
        twitter.getOauth(user, function (err, oauth) {  
          if (err) {    
            callback(err);
          } else {
            request.post({
              url: 'https://api.twitter.com/1.1/statuses/retweet/'+post.targets.twitter.id+'.json',
              oauth: oauth
            }, function (err, res, body) {
              if (err) {
                callback(err);
              }
              body = JSON.parse(body);
              if (res.statusCode === 200 && body.hasOwnProperty('id_str')) {
                return callback(null, body);
              }
            });
          }
        });
      }
    }
  },
  getOauth : function (userId, callback) {
    var accessToken,
      accessTokenSecret;
    module.parent.exports.getUser(userId, function(err, user) {
      if (err) {
        callback(err);
      } else {
        // check if user has registered a twitter account
        if (user.provider === 'twitter') {
          accessToken = user.providerData.token;
          accessTokenSecret = user.providerData.tokenSecret;
        } else if (user.additionalProvidersData && user.additionalProvidersData.twitter) {
          accessToken = user.additionalProvidersData.twitter.token;
          accessTokenSecret = user.additionalProvidersData.twitter.tokenSecret;
        } else {
          callback('user has not registered a twitter account yet!');
        }
        var oauth = {
          consumer_key: config.twitter.clientID,
          consumer_secret: config.twitter.clientSecret,
          token: accessToken,
          token_secret: accessTokenSecret
        };
        callback(null, oauth);
      }
    });
  }
};

module.exports.twitter = twitter;