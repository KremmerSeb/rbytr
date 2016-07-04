'use strict';
var mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  Moment = require('moment'),
  util = require('util'),
  async = require('async');

var RateLimit = {
  create : {
    post : {
      /**
       * assign
       * 
       * Assign task.target to controller
       * e.g. to check 'twitter' use ratelimits.twitter.server.controller.js  
       * 
       * This is used while creating a post: probably postponing a posts' task  
       * 
       * @param {object} postObject - The post to be inserted
       * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
       * @param {Function} [callback] - A callback which is called as soon as all
       * tasks are adjusted (valid or postponed), or an error occurs. Invoked 
       * with (err, [res]).
       */
      assign : function (postObject, engagementType, callback) {
        var self = this,
          post = postObject,
          res = [];
        async.mapSeries(post.tasks, function (task, callback) {
          if (task.hasOwnProperty('target')) {
            // now task.target assign to controller
            RateLimit[task.target].adjustTasks(post, task, engagementType, function (err, res){
              post = res.post;
              if (err) {
                callback(err);
              } else {
                callback(null, res);
              }
            });
          } else {
            postObject.tasks = {};
            res.post = postObject;
            callback(null, res);
          }
        }, function (err, res) {
          if (err) {
            callback(err);
          } else {
            callback(null, res);
          }
        });
      }
    },
    engagement : {
      /**
       * assign
       * 
       * Assign task.target to controller
       * e.g. to check 'twitter' use ratelimits.twitter.server.controller.js  
       * 
       * This is used while creating an engagement: probably postponing an engagements' task  
       * 
       * @param {object} postObject - The post to be inserted
       * @param {object} tasks - 
       * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
       * @param {object} reqUser - user object of requesting user (i.e. the user who likes, shares, etc.)
       * @param {Function} [callback] - A callback which is called as soon as all
       * tasks are adjusted (valid or postponed), or an error occurs. Invoked 
       * with (err, [res]).
       */
      assign : function (postObject, tasks, engagementType, reqUser, callback) {
        var self = this,
          post = postObject,
          res = [];
        async.mapSeries(tasks, function (task, callback) {
          if (RateLimit.hasOwnProperty(task.target) 
              && RateLimit[task.target].hasOwnProperty('create') 
              && RateLimit[task.target].create.hasOwnProperty('engagement')) {
            RateLimit[task.target].create.engagement.adjustTasks(post, task, engagementType, reqUser, function (err, res){
              post = res.post;
              if (err) {
                callback(err);
              } else {
                callback(null, res);
              }
            });
          } else {
            res.post = postObject;
            callback(null, res);
          }
        }, function (err, res) {
          if (err) {
            callback(err);
          } else {
            callback(null, res);
          }
        });
      }
    }
  }
};
module.exports = RateLimit;