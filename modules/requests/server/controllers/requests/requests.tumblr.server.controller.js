'use strict';
var _ = require('lodash'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  config = require(path.resolve('./config/config')),
  Post = mongoose.model('Post'),
  request = require('request');

var tumblr = {
  create : {
    post : function (post, callback) {
      tumblr.getOauth(post.user, function (err, oauth) {
        if (err) {
          callback(err);
        } else {
          // check if blogIdentifier is correct 
          request.get({
            url: 'https://api.tumblr.com/v2/blog/'+oauth.blogIdentifier+'/info?api_key='+config.tumblr.clientID,
            json: true,
            oauth: oauth,
            followRedirect: false
          }, function (err, res, body) {
            if (err) {
              callback(err);
            }
            if (!err && body.response.blog.name+'.tumblr.com' === oauth.blogIdentifier) {
              // look here: https://github.com/tumblr/tumblr.js/blob/master/lib/tumblr.js#L181
              request.post({
                url: 'https://api.tumblr.com/v2/blog/'+oauth.blogIdentifier+'/post',
                oauth: oauth,
                form: {
                  'body': post.content
                }
              }, function (err, res, body) {
                if (err) {
                  callback(err);
                }
                callback(body);
              });
            }
          });
        }
      });
    },
    postMedia : function (req, res) {}
  },
  getOauth : function (userId, callback) {
    var token,
      tokenSecret,
      blogIdentifier;
    module.parent.exports.getUser(userId, function(err, user) {
      if (err) {
        callback(err);
      } else {
        // check if user has registered a tumblr account
        if (user.provider === 'tumblr') {
          token = user.providerData.token;
          tokenSecret = user.providerData.tokenSecret;
          blogIdentifier = user.providerData.blogIdentifier;
        } else if (user.additionalProvidersData && user.additionalProvidersData.tumblr) {
          token = user.additionalProvidersData.tumblr.token;
          tokenSecret = user.additionalProvidersData.tumblr.tokenSecret;
          blogIdentifier = user.additionalProvidersData.tumblr.blogIdentifier;
        } else {
          callback('user has not registered a tumblr account yet!');
        }
        var oauth = {
          consumer_key: config.tumblr.clientID,
          consumer_secret: config.tumblr.clientSecret,
          token: token,
          token_secret: tokenSecret,
          blogIdentifier: blogIdentifier
        };
        callback(null, oauth);
      }
    });
  }
};

module.exports.tumblr = tumblr;