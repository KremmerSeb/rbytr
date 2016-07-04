'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  User = mongoose.model('User'),
  Moment = require('moment'),
  util = require('util'),
  async = require('async'),
  RateLimit = require('../../../ratelimits/server/controllers/ratelimits.server.controller'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a post
 */
exports.create = function (req, res) {
  var post = req.body,
    engagementType = 'posts';
  post.user = req.user;
  
  // check for for possible rate limitation
  RateLimit.create.post.assign(post, engagementType, function (err, response) {
    post = new Post(response[0].post);
    if (!err) {
      post.save(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.json(post);
        }
      });
    } else {
      // err from RateLimit
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  });
};

/**
 * Show the current post
 */
exports.read = function (req, res) {
  res.json(req.post);
};

/**
 * Update a post
 */
exports.update = function (req, res) {
  var post = req.post;
  post.title = req.body.title;
  post.content = req.body.content;
  post.likes = req.body.likes;
  
  // check for ratelimits of likes/shares/etc. and postpone if needed - before saving the post
  post.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(post);
    }
  });
};

/**
 * Delete an post
 */
exports.delete = function (req, res) {
  var post = req.post;
  
  post.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(post);
    }
  });
};

/**
 * List of Posts
 */
exports.list = function (req, res) {
  var params = {};
  if (req.params.userId) {
    params = { 'user':req.params.userId };
  }
  // http://stackoverflow.com/questions/21069813/mongoose-multiple-query-populate-in-a-single-call
  Post.find(params).sort('-created').populate({ path:'user', select:'displayName profileImageURL' }).exec(function (err, posts) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(posts);
    }
  });
};

/**
 * Post middleware
 */
exports.postByPostId = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Post is invalid'
    });
  }

  Post.findById(id).populate('user', 'displayName').exec(function (err, post) {
    if (err) {
      return next(err);
    } else if (!post) {
      return res.status(404).send({
        message: 'No post with that identifier has been found'
      });
    }
    req.post = post;
    next();
  });
};

exports.postsByUserId = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findOne({
    _id: id
  }).exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load User ' + id));
    }

    req.profile = user;
    next();
  });
};

/**
 * Get likes
 */
exports.likes = function (req, res) {};

/**
 * Like
 * 
 * - Postpones all like-tasks to future
 * - Handles like and unlike
 * - Saves post after check for ratelimits
 * 
 */
exports.like = function (req, res) {
  var post = req.post,
    like = req.body,
    engagementType = 'likes',
    reqUser = req.user,
    now = new Moment().format(), 
    nowPlusOne = new Moment().add(1, 'm').format(),
    nowPlusTwo = new Moment().add(2, 'm').format();
  
  /**
   * Postpone like-tasks to future
   * if a user likes a post with 'tasks in the past', the like-tasks must be postponed from past to now+2
   * as like-tasks come as clone from post-tasks we can check if 'desired' like-tasks are in the past or future
   * else : postpone like-tasks to likeTaskItem.moment+1 (we need to wait for the post.task response to get the id)
   */
  async.forEachOf(like.tasks, function (likeTaskItem, key, callback) {
    if (new Date(nowPlusTwo) > new Date(likeTaskItem.moment)) {
      like.tasks[key].moment = new Moment(now).add(2, 'm').format();
    } else {
      like.tasks[key].moment = new Moment(likeTaskItem.moment).add(3, 'm').format();
    }
  });
  
  /**
   * like is not empty and an object - it's a like
   */
  if (Object.keys(like).length !== 0 && like.constructor === Object) {
    post.likes.push(like);
    // check for ratelimits of likes and postpone if needed - before saving the post
    RateLimit.create.engagement.assign(post, like.tasks, engagementType, reqUser, function (err, response) {
      if (!err) {
        post = response[0].post;
        post.save(function (err) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            res.json(post);
          }
        });
      } else {
        // err from RateLimit
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
    });
  /**
   * like is empty and an object -> it's not a like -> it's an unlike
   */
  } else if (Object.keys(like).length === 0 && like.constructor === Object) {
    var likeKey;
    async.forEachOf(post.likes, function (item, key, callback) {
      var likeUser = JSON.stringify(item.user);
      var reqUser = JSON.stringify(req.user._id);
      if (likeUser === reqUser) {
        likeKey = key;
        return callback(null);
      }
      return callback(null);
    }, function (err) {
      post.likes.splice(likeKey, 1);
      post.save(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.json(post);
        }
      });
    });
  /**
   * like is not an object -> don't touch post -> response with original post
   */ 
  } else {
    res.json(post);
  }
};

/**
 * Share
 * 
 * - Postpones all share-tasks to future
 * - Handles share and unshare
 * - Saves post after check for ratelimits
 */
exports.share = function (req, res) {
  var post = req.post,
    share = req.body,
    engagementType = 'shares',
    reqUser = req.user,
    now = new Moment().format(), 
    nowPlusOne = new Moment().add(1, 'm').format(),
    nowPlusTwo = new Moment().add(2, 'm').format();
  /**
   * Postpone share-tasks to future
   * if : a user shares a post with 'tasks in the past', the share-tasks must be postponed from past to now+2
   * as share-tasks come as clone from post-tasks we can check if 'desired' share-tasks are in the past or future
   * else : postpone share-tasks to shareTaskItem.moment+1 (we need to wait for the post.task response to get the id)  
   */
  async.forEachOf(share.tasks, function (shareTaskItem, key, callback) {
    if (new Date(nowPlusTwo) > new Date(shareTaskItem.moment)) {
      share.tasks[key].moment = new Moment(now).add(2, 'm').format();
    } else {
      share.tasks[key].moment = new Moment(shareTaskItem.moment).add(3, 'm').format();
    }
  });
  /**
   * share is not empty and an object - it's a share
   */
  if (Object.keys(share).length !== 0 && share.constructor === Object) {
    post.shares.push(share);
    // check for ratelimits of shares and postpone if needed - before saving the post
    RateLimit.create.engagement.assign(post, share.tasks, engagementType, reqUser, function (err, response) {
      if (!err) {
        post = response[0].post;
        post.save(function (err) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            res.json(post);
          }
        });
      } else {
        // err from RateLimit
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
    });
  /**
   * share is empty and an object -> it's not a share -> it's an unshare
   */
  } else if (Object.keys(share).length === 0 && share.constructor === Object) {
    var shareKey;
    async.forEachOf(post.shares, function (item, key, callback) {
      var shareUser = JSON.stringify(item.user);
      var reqUser = JSON.stringify(req.user._id);
      if (shareUser === reqUser) {
        shareKey = key;
        return callback(null);
      }
      return callback(null);
    }, function (err) {
      post.shares.splice(shareKey, 1);
      post.save(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.json(post);
        }
      });
    });
  /**
   * share is not an object -> don't touch post -> response with original post
   */ 
  } else {
    res.json(post);
  }
};