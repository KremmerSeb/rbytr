'use strict';
var CronJob = require('cron').CronJob,
  mongoose = require('mongoose'),
  async = require('async'),
  Post = mongoose.model('Post'),
  Moment = require('moment'),
  util = require('util'),
  Request = require('../../modules/requests/server/controllers/requests.server.controller.js'),
  Tasks = require('../../modules/tasks/server/tasks.server.controller.js');

module.exports = function() {
  var getJobs = new CronJob(
    '0 0-59 * * * *',
    function() {
      // params to get all types(posts, likes, shares) of tasks
      var now = new Moment().format(), 
        nowPlusOne = new Moment().add(1, 'm').format(),
        nowPlusTwo = new Moment().add(2, 'm').format(),
        engagementTypes = ['likes', 'shares'];
      
      Tasks.getCronTasks(function (err, posts) {
        if (err) {
          console.log(err);
        } else {
          async.each(posts, function(post, callback) {
            // handle each task as a single cronjob:
            // search in all posts for tasks to be done if: now < task.moment <= nowPlusOne
            async.forEachOf(post.tasks, function (item, key, callback) {
              if ((new Date(nowPlusOne) >= new Date(item.moment)) && (new Date(item.moment) > new Date(now))) {
                var job = new CronJob({
                  cronTime: new Date(item.moment),
                  onTick: function () {
                    Request.create.post.assign(post, item.target);
                    callback(null);
                  },
                  onComplete: function () {
                    callback('job stopped');
                  },
                  start: true,
                  timeZone: 'Europe/Berlin'
                });
              }
            });
            // search in all posts for tasks to be done if: now < likes.task.moment <= nowPlusOne
            async.forEachOf(post.likes, function (item, key, callback) {
              async.forEachOf(item.tasks, function (taskItem, key, callback) {
                if ((new Date(nowPlusOne) >= new Date(taskItem.moment)) && (new Date(taskItem.moment) > new Date(now))) {
                  console.log(taskItem);
                  var job = new CronJob({
                    cronTime: new Date(taskItem.moment),
                    onTick: function () {
                      Request.create.engagement.assign(post, taskItem.target, engagementTypes[0], item.user);
                      callback(null);
                    },
                    onComplete: function () {
                      callback('job stopped');
                    },
                    start: true,
                    timeZone: 'Europe/Berlin'
                  });
                }
              });
            });
            // search in all posts for tasks to be done if: now < shares.task.moment <= nowPlusOne
            async.forEachOf(post.shares, function (item, key, callback) {
              async.forEachOf(item.tasks, function (taskItem, key, callback) {
                if ((new Date(nowPlusOne) >= new Date(taskItem.moment)) && (new Date(taskItem.moment) > new Date(now))) {
                  console.log(taskItem);
                  var job = new CronJob({
                    cronTime: new Date(taskItem.moment),
                    onTick: function () {
                      Request.create.engagement.assign(post, taskItem.target, engagementTypes[1], item.user);
                      callback(null);
                    },
                    onComplete: function () {
                      callback('job stopped');
                    },
                    start: true,
                    timeZone: 'Europe/Berlin'
                  });
                }
              });
            });
            callback(null);
          }, function(err) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    }
  );
  getJobs.start();
};