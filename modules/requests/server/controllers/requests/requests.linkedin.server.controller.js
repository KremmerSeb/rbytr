'use strict';
var _ = require('lodash'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  config = require(path.resolve('./config/config')),
  Post = mongoose.model('Post'),
  request = require('request');

var linkedin = {
  create : {
    post : function (post, callback) {
      linkedin.getOauth(post.user, function (err, oauth) {
        if (err) {
          callback(err);
        } else {
          request.post('https://api.linkedin.com/v1/people/~/shares?format=json&oauth2_access_token='+oauth.token, {
            body: {
              'comment': post.content,
              'visibility': {
                'code': 'connections-only'
              }
            },
            json: true
          }, function (err, res, body) {
            if (err) {
              callback(err);
            }
            callback(null, body);
          });
        }
      });
    },
    /**
     * Post with media
     * currently not possible:
     * http://stackoverflow.com/questions/29053529/how-do-i-upload-a-photo-image-to-linkedin-via-api
     * https://developer.linkedin.com/docs/share-on-linkedin
     * workaround: just share post.content
     */
    postWithMedia : function (params, callback) {
      linkedin.create.post(params, function (err, body) {
        if (err) {
          callback(err);
        } else {
          callback(null, body);
        }
      });
    }
  },
  getOauth : function (userId, callback) {
    var accessToken,
      refreshToken;
    module.parent.exports.getUser(userId, function(err, user) {
      if (err) {
        callback(err);
      } else {
        // check if user has registered a linkedin account
        if (user.provider === 'linkedin') {
          accessToken = user.providerData.accessToken;
          refreshToken = user.providerData.refreshToken;
        } else if (user.additionalProvidersData && user.additionalProvidersData.linkedin) {
          accessToken = user.additionalProvidersData.linkedin.accessToken;
          refreshToken = user.additionalProvidersData.linkedin.refreshToken;
        } else {
          callback('user has not registered a linkedin account yet!');
        }
        var oauth = {
          consumer_key: config.linkedin.clientID,
          consumer_secret: config.linkedin.clientSecret,
          token: accessToken,
          refresh_token: refreshToken
        };
        callback(null, oauth);
      }
    });
  }
};

module.exports.linkedin = linkedin;