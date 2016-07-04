'use strict';
var _ = require('lodash'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  Tasks = require(path.resolve('./modules/tasks/server/tasks.server.controller.js')),
  mongoose = require('mongoose'),
  config = require(path.resolve('./config/config')),
  Post = mongoose.model('Post'),
  User = mongoose.model('User'),
  util = require('util'),
  async = require('async'),
  Moment = require('moment');

var twitter = {
  /**
   * findTasksOverflow
   * 
   * Find possible overflow of tasks that would return a HTTP 429 
   * Too Many Requests response code 
   * 
   * @param {object} task - the desired task
   * @param {array} posts - the posts with already approved tasks from db
   * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
   * @param {Function} [callback] - A callback which is called as soon as all
   * intervals are checked for an overflow, or an error occurs. Invoked with
   * (err, [tasksOverflow])
   */
  findTasksOverflow : function (post, task, posts, engagementType, callback) {
    var tasksOverflow = [],
      desiredTask = task,
      params = {
        range: {
          start: 15,
          end: 15,
          size: 'm'
        },
        user: post.user._id
      },
      intervalEndpoint = '',
      rateLimit = 3;
    
    async.map(posts, function (post, callback) {
      // get only intervals for one specific task.target i.e. twitter
      async.map(post.tasks, function (task, callback) {
        if (task.target === desiredTask.target) {
          // now get interval starting from this specific task
          Tasks.getByTasks(params, task, engagementType, function (err, posts) {
            if (err) {
              callback(err);
            } else {
              if (posts.length >= rateLimit) {
                intervalEndpoint = new Moment(task.moment).add(params.range.end, params.range.size).format();
                tasksOverflow.push(intervalEndpoint);
              }
              callback(null, tasksOverflow);
            }
          });
        } else {
          callback(null);
        }
      }, function (err, tasksOverflow) {
        if (err) {
          callback(err);
        } else {
          callback(null, tasksOverflow);
        }
      });
    }, function (err, tasksOverflow) {
      if (err) {
        callback(err);
      } else {
        callback(null, tasksOverflow);
      }
    });
  },

  /**
   * postponeTask
   * 
   * Postpones a task to an available interval
   * ---> Must check if the interval of the postponed Task is overflowed as well
   * 
   * @param {object} post - The post to be postponed
   * @param {array} tasksOverflow - Array of moments that are endpoints of 
   * full intervals
   * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
   * @param {Function} [callback] - A callback which is called as soon as the
   * task was postponed, or an error occurs. Invoked with (err, post).
   * 
   */
  postponeTask : function (post, tasksOverflow, engagementType, callback) {
    // blocking
    var endpoints = tasksOverflow.map(function (endpoint) {
      return new Moment(endpoint);
    });
    
    var firstEndpoint = Moment.min(endpoints).format(),
      lastEndpoint = Moment.max(endpoints).format();
    
    var newTask = {
      moment: new Moment(lastEndpoint).add(1, 'm').format(),
      target: 'twitter',
      postponed: true
    };
    var newPost = post;
    
    // create post with postponed task
    async.map(newPost.tasks, function (task, callback) {
      if (task.target === 'twitter') {
        task = newTask;
      }
      callback(null, task);
    }, function (err, tasks) {
      if (err) {
        callback(err);
      } else {
        // post with postponed task
        newPost.tasks = tasks;
  
        // check if postponed task results in overflow
        async.map(newPost.tasks, function (task, callback) {
          if (task.target === 'twitter') {
            twitter.adjustTasks(newPost, task, engagementType, function (err, res) {
              if (err) {
                callback(err);
              } else {
                callback(null, res);
              }
            });
          } else {
            callback();
          }
        }, function (err, res) {
          if (err) {
            callback(err);
          } else {
            callback(null, res);
          }
        });
      }
    });
  },

  /**
   * adjustTasks
   * 
   * Adjust tasks means getting approved tasks before and after 15 min,
   *   then checking for possible overflow, 
   *   then postponing if needed and 
   *   finally invoking callback with (err, [res]).
   * 
   * @param {object} post - The post to be inserted
   * @param {object} task - The desired task to be inserted
   * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
   * @param {Function} [callback] - A callback which is called as soon as all
   * tasks are postponed (if needed), or an error occurs. Invoked 
   * with (err, [res]).
   */
  adjustTasks : function (post, task, engagementType, callback) {
    var res = {};
    var params = {
      range: {
        start: 15,
        end: 15,
        size: 'm'
      },
      user: post.user._id
    };
    
    // finds all posts with twitter tasks of a given interval
    Tasks.getByTasks(params, task, engagementType, function (err, posts) {
      if (err) {
        callback(err);
      } else {

        // Find possible overflow of tasks
        twitter.findTasksOverflow(post, task, posts, engagementType, function (err, tasksOverflow) {
          if (err) {
            callback(err);
          } else {
            if (tasksOverflow.length > 0) {
              tasksOverflow = tasksOverflow[0].filter(function (n) {
                return n !== undefined;
              })[0];
            }
            if (tasksOverflow.length === 0) {
              res.tasksOverflow = tasksOverflow;
              res.post = post;
              callback(null, res);
            } else {
              
              // Postpone task
              twitter.postponeTask(post, tasksOverflow, engagementType, function (err, post) {
                if (err) {
                  callback(err);
                } else {
                  post = post.filter(function (n) {
                    return n !== undefined;
                  });
                  if (post[0].hasOwnProperty('post')) {
                    post = post[0].post;
                  }
                  res.tasksOverflow = tasksOverflow;
                  res.post = post;
                  callback(null, res);
                }
              });
            }
          }
        });
      }
    });
  },
  create : {
    engagement : {
      /**
       * findTasksOverflow
       * 
       * Find possible overflow of tasks that would return a HTTP 429 
       * Too Many Requests response code 
       * 
       * @param {object} task - the desired task
       * @param {array} posts - the posts with already approved tasks from db
       * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
       * @param {Function} [callback] - A callback which is called as soon as all
       * intervals are checked for an overflow, or an error occurs. Invoked with
       * (err, [tasksOverflow])
       */
      findTasksOverflow : function (post, task, posts, engagementType, callback) {
        var tasksOverflow = [],
          desiredTask = task,
          params = {
            range: {
              start: 15,
              end: 15,
              size: 'm'
            },
            user: post.user._id
          },
          intervalEndpoint = '',
          rateLimit = 3;
        
        async.map(posts, function (post, callback) {
          // get only intervals for one specific task.target i.e. twitter
          async.map(post.tasks, function (task, callback) {
            if (task.target === desiredTask.target) {
              // now get interval starting from this specific task
              Tasks.getByTasks(params, task, engagementType, function (err, posts) {
                if (err) {
                  callback(err);
                } else {
                  if (posts.length >= rateLimit) {
                    intervalEndpoint = new Moment(task.moment).add(params.range.end, params.range.size).format();
                    tasksOverflow.push(intervalEndpoint);
                  }
                  callback(null, tasksOverflow);
                }
              });
            } else {
              callback(null);
            }
          }, function (err, tasksOverflow) {
            if (err) {
              callback(err);
            } else {
              callback(null, tasksOverflow);
            }
          });
        }, function (err, tasksOverflow) {
          if (err) {
            callback(err);
          } else {
            callback(null, tasksOverflow);
          }
        });
      },

      /**
       * postponeTask
       * 
       * Postpones a task to an available interval
       * ---> Must check if the interval of the postponed Task is overflowed as well
       * 
       * @param {object} post - The post to be postponed
       * @param {array} tasksOverflow - Array of moments that are endpoints of 
       * full intervals
       * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
       * @param {object} reqUser - user object of requesting user (i.e. the user who likes, shares, etc.)
       * @param {Function} [callback] - A callback which is called as soon as the
       * task was postponed, or an error occurs. Invoked with (err, post).
       * 
       */
      postponeTask : function (post, tasksOverflow, engagementType, reqUser, callback) {
        var newPost = post;
        
        // blocking
        var endpoints = tasksOverflow.map(function (endpoint) {
          return new Moment(endpoint);
        });
        
        var firstEndpoint = Moment.min(endpoints).format(),
          lastEndpoint = Moment.max(endpoints).format();
        
        var newTask = {
          moment: new Moment(lastEndpoint).add(1, 'm').format(),
          target: 'twitter',
          postponed: true
        };
        
        // create post with {{engagementType}} with postponed task
        async.map(newPost[engagementType], function (engagementTypeItem, callback) {
          var likeUser = JSON.stringify(engagementTypeItem.user);
          reqUser = JSON.stringify(reqUser);
          
          if (likeUser === reqUser) {
            async.map(engagementTypeItem.tasks, function (task, callback) {
              if (task.target === 'twitter') {
                task = newTask;
              }
              return callback(null, task);
            }, function (err, tasks) {
              if (err) {
                callback(err);
              } else {
                if (likeUser === reqUser) {
                  engagementTypeItem.tasks = tasks;
                }
                
                // check if postponed {{engagementType}} task results in overflow
                async.map(engagementTypeItem.tasks, function (task, callback) {
                  if (task.target === 'twitter') {
                    twitter.create.engagement.adjustTasks(newPost, task, engagementType, reqUser, function (err, res) {
                      if (err) {
                        callback(err);
                      } else {
                        callback(null, res);
                      }
                    });
                  } else {
                    callback();
                  }
                }, function (err, res) {
                  if (err) {
                    callback(err);
                  } else {
                    callback(null, res);
                  }
                });
              }
            });
          }
        }, function (err, res) {
          if (err) {
            return callback(err);
          } else {
            return callback(null, res);
          }
        });
      },

      /**
       * adjustTasks
       * 
       * Adjust tasks means getting approved tasks before and after 15 min,
       *   then checking for possible overflow, 
       *   then postponing if needed and 
       *   finally invoking callback with (err, [res]).
       * 
       * @param {object} post - The post to be inserted
       * @param {object} task - The desired task to be inserted
       * @param {string} engagementType - e.g. 'likes', 'shares', 'posts'
       * @param {object} reqUser - user object of requesting user (i.e. the user who likes, shares, etc.)
       * @param {Function} [callback] - A callback which is called as soon as all
       * tasks are postponed (if needed), or an error occurs. Invoked 
       * with (err, [res]).
       */
      adjustTasks : function (post, task, engagementType, reqUser, callback) {
        var res = {};
        var params = {
          range: {
            start: 15,
            end: 15,
            size: 'm'
          },
          user: post.user._id
        };
        
        // finds all posts with twitter tasks of a given interval
        Tasks.getByTasks(params, task, engagementType, function (err, posts) {
          if (err) {
            callback(err);
          } else {

            // Find possible overflow of tasks
            twitter.create.engagement.findTasksOverflow(post, task, posts, engagementType, function (err, tasksOverflow) {
              if (err) {
                callback(err);
              } else {
                if (tasksOverflow.length > 0) {
                  // http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript/2843625#2843625
                  tasksOverflow = tasksOverflow[0].filter(function (n) {
                    return n !== undefined;
                  })[0];
                }
                if (tasksOverflow.length === 0) {
                  res.tasksOverflow = tasksOverflow;
                  res.post = post;
                  callback(null, res);
                } else {
                  // Postpone task
                  twitter.create.engagement.postponeTask(post, tasksOverflow, engagementType, reqUser._id, function (err, post) {
                    if (err) {
                      callback(err);
                    } else {
                      post = post.filter(function (n) {
                        return n !== undefined;
                      });
                      if (post[0][0].hasOwnProperty('post')) {
                        post = post[0][0].post;
                      }
                      res.tasksOverflow = tasksOverflow;
                      res.post = post;
                      callback(null, res);
                    }
                  });
                }
              }
            });
          }
        });
      }
    }
  }
};

module.exports.twitter = twitter;