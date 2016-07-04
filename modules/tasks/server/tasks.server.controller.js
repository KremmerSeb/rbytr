'use strict';
var mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  Moment = require('moment'),
  util = require('util'),
  async = require('async');

/**
 * getCronTasks
 * 
 * Getting all types of tasks for cron
 * 
 * @param {object} params - Start, endpoint and size of interval to look for
 * @param {object} task - the desired task
 * @param {Function} [callback] - A callback which is called as soon as all
 * posts are gathered, or an error occurs. Invoked with (err, [posts]).
 * 
 */
exports.getCronTasks = function (callback) {
  var params = [
    {
      'tasks': {
        $elemMatch: {
          'moment': { '$gte': new Moment().format(), '$lt': new Moment().add(2, 'm').format() },
        }
      }
    },
    {
      'likes': {
        $elemMatch: {
          'tasks': {
            $elemMatch: {
              'moment': { '$gte': new Moment().format(), '$lt': new Moment().add(2, 'm').format() },
            }
          }
        }
      }
    },
    {
      'shares': {
        $elemMatch: {
          'tasks': {
            $elemMatch: {
              'moment': { '$gte': new Moment().format(), '$lt': new Moment().add(2, 'm').format() },
            }
          }
        }
      }
    }
  ];
  Post.find({ $or: params }).sort('-created').populate('user', 'displayName').exec(function (err, posts) {
    if (err) {
      callback(err);
    } else {
      callback(null, posts);
    }
  });
};

/**
 * getByTasks
 * 
 * Getting all posts that have tasks of task.target within a given range
 * 
 * @param {object} params - Start, endpoint and size of interval to look for
 * @param {object} task - the desired task
 * @param {string} engagementType - the specified engagement type
 * @param {Function} [callback] - A callback which is called as soon as all
 * posts are gathered, or an error occurs. Invoked with (err, [posts]).
 * 
 */
exports.getByTasks = function (params, task, engagementType, callback) {
  var nowMinusRangeStart = new Moment(task.moment).subtract(params.range.start, params.range.size).format(),
    nowPlusRangeStart = new Moment(task.moment).add(params.range.end, params.range.size).format();
  switch (engagementType) {
    case 'likes':
      params = {
        'likes': {
          $elemMatch: {
            'tasks': {
              $elemMatch: {
                'moment': { '$gte': nowMinusRangeStart, '$lt': nowPlusRangeStart },
                'target': task.target
              }
            },
            'user': params.user
          }
        }
      };
      break;
    case 'shares':
      params = {
        'shares': {
          $elemMatch: {
            'tasks': {
              $elemMatch: {
                'moment': { '$gte': nowMinusRangeStart, '$lt': nowPlusRangeStart },
                'target': task.target
              }
            },
            'user': params.user
          }
        }
      };
      break;
    case 'posts':
      params = {
        'tasks': {
          $elemMatch: {
            'moment': { '$gte': nowMinusRangeStart, '$lt': nowPlusRangeStart },
            'target': task.target
          }
        },
        'user': params.user
      };
      break;
  }
  
  // finds all posts with twitter tasks of a given window
  Post.find(params).sort('-created').exec(function (err, posts) {
    if (err) {
      callback(err);
    } else {
      callback(null, posts);
    }
  });
};

/**
 * getByLikeTasks
 * 
 * Getting all posts with likes that have tasks of task.target within a given range
 * 
 * @param {object} params - Start, endpoint and size of interval to look for
 * @param {object} task - the desired task
 * @param {Function} [callback] - A callback which is called as soon as all
 * posts are gathered, or an error occurs. Invoked with (err, [posts]).
 * 
 */
exports.getByLikeTasks = function (params, task, callback) {
  var nowMinusRangeStart = new Moment(task.moment).subtract(params.range.start, params.range.size).format(),
    nowPlusRangeStart = new Moment(task.moment).add(params.range.end, params.range.size).format();

  params = {
    'likes': {
      'tasks': {
        $elemMatch: {
          'moment': { '$gte': nowMinusRangeStart, '$lt': nowPlusRangeStart },
          'target': task.target
        }
      },
      'user': params.user
    }
  };
  
  // finds all posts with twitter tasks of a given window
  Post.find(params).sort('-created').exec(function (err, posts) {
    if (err) {
      callback(err);
    } else {
      callback(null, posts);
    }
  });
};

/**
 * getByShareTasks
 * 
 * Getting all posts with shares that have tasks of task.target within a given range
 * 
 * @param {object} params - Start, endpoint and size of interval to look for
 * @param {object} task - the desired task
 * @param {Function} [callback] - A callback which is called as soon as all
 * posts are gathered, or an error occurs. Invoked with (err, [posts]).
 * 
 */
exports.getByShareTasks = function (params, task, callback) {
  var nowMinusRangeStart = new Moment(task.moment).subtract(params.range.start, params.range.size).format(),
    nowPlusRangeStart = new Moment(task.moment).add(params.range.end, params.range.size).format();

  params = {
    'shares': {
      'tasks': {
        $elemMatch: {
          'moment': { '$gte': nowMinusRangeStart, '$lt': nowPlusRangeStart },
          'target': task.target
        }
      },
      'user': params.user
    }
  };
  
  // finds all posts with twitter tasks of a given window
  Post.find(params).sort('-created').exec(function (err, posts) {
    if (err) {
      callback(err);
    } else {
      callback(null, posts);
    }
  });
};