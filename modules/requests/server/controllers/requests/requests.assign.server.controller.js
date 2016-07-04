'use strict';
var mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  User = mongoose.model('User'),
  posts = require('../../../../posts/server/controllers/posts.server.controller');

var Request = {
  create : {
    post : {
      /**
       * Assign post to desired target i.e. send 'post' to target 'name'
       * 
       * maybe add decision: 'justPost' or 'postWithMedia'
       * 
       * @param {object} post - the post object to be sent
       * @param {string} target - the target name, e.g. 'twitter', 'linkedin'
       */
      assign : function (post, target) {
        if (Request.hasOwnProperty(target)) {
          // post has min 1 files
          if (post.files.length>=1) {
            Request[target].create.postWithMedia(post, function (err, body) {
              if (!err) {
                Request.addTargetPostId(target, post, body.id_str);
              }
            });
          // post has 0 files -> text only
          } else {
            Request[target].create.post(post, function (err, body) {
              if (!err) {
                Request.addTargetPostId(target, post, body.id_str);
              }
            });
          }
        } else {
          console.log('Request.create.post.assign: missing target controller for: ' + target + '.');
        }
      }
    },
    engagement : {
      /**
       * Assign post to desired target i.e. send 'post' to target 'name'
       * 
       * maybe add decision: 'justPost' or 'postWithMedia'
       * 
       * @param {object} post - the post object to be sent
       * @param {string} target - the target name, e.g. 'twitter', 'linkedin'
       * @param {string} engagementType
       * @param {string} userId - the user id 
       */
      assign : function (post, target, engagementType, userId) {
        if (Request.hasOwnProperty(target)) {
          if (Request[target].create.hasOwnProperty('engagement')) {
            Request[target].create.engagement[engagementType](post, userId, function (err, body) {
              if (err) {
                console.log(err);
              }
            });
          } else {
            console.log(target + '-controller has no property: \'engagement\'');
          }
        } else {
          console.log('Request.create.engagement.assign: missing target controller for: ' + target + '.');
        }
      }
    }
  },
  /**
   * Get user object by user._id
   */
  getUser : function (user, callback) {
    User.findOne({
      _id: user
    }).exec(function (err, user) {
      if (err) {
        callback(err);
      } else if (!user) {
        callback(new Error('Failed to load User ' + user._id));
      } else {
        callback(null, user);
      }
    });
  },
  /**
   * Get all possible targets to post to
   */
  targets : function (req, res) {
    // subtract array from array
    Array.prototype.diff = function(a) {
      return this.filter(function(i) {
        return a.indexOf(i) < 0;
      });
    };
    var requestsObj = Object.keys(module.exports);
    var targets = requestsObj.diff(['assign', 'getUser', 'targets', 'addTargetPostId']);
    if (req.user) {
      res.json(targets);
    }
  },
  /**
   * Add postId of post from target to postObject in rbytr will be used for future
   * engagements
   * 
   * @param {string}
   *          target - the target name, e.g. 'twitter', 'linkedin'
   * @param {object}
   *          post - the post object that has been sent
   * @param {string}
   *          id - the foreign id from 'target' for the post, to be saved in the
   *          post object
   */
  addTargetPostId : function (target, post, id) {
    post.targets[target].id = id;
    post.save(function (err) {
      if (err) {
        console.log(err);
      }
    });
  }
};
module.exports = Request;