'use strict';

// Posts controller
angular.module('posts')
  .config(function($mdIconProvider) {
    $mdIconProvider
    .iconSet('call', 'img/icons/sets/communication-icons.svg', 24)
    .iconSet('social', 'img/icons/sets/social-icons.svg', 24);
  })
  .controller('PostsController', ['$window', '$scope', '$state', '$location', 'Authentication', 'Posts', 'Post', 'Targets', '$sce', 'moment', 'Upload', 'containsFilter',
  function ($window, $scope, $state, $location, Authentication, Posts, Post, Targets, $sce, Moment, Upload, containsFilter) {
    $scope.authentication = Authentication;
    $scope.$state = $state;
    $scope.disabled = false;
    
    /**
     * Get available targets
     * 
     * @param {Function} [callback] - A callback which is called after intersection
     * of all rbytrTargets and all configured userTargets, or an error occurs. 
     * Invoked with (err, [intersectTargets]) 
     * 
     * e.g.:
     * var intersectTargets = ['twitter', 'linkedin', 'facebook'];
     */
    $scope.getAvailableTargets = function (callback) {
      // get rbytrTargets
      Targets.query().$promise.then(function (results) {
        if (!results) {
          callback('no rbytrTargets');
        }
        var userTargets = [],
          rbytrTargets = [];
        
        // get userTargets
        if ($scope.authentication.user.additionalProvidersData) {
          userTargets = Object.keys($scope.authentication.user.additionalProvidersData);
        }
        userTargets.push($scope.authentication.user.provider);

        // lowerCase rbytrTargets
        angular.forEach(results, function(value, key, obj) {
          rbytrTargets.push(value.toLowerCase());
        });
        
        // intersect rbytrTargets and userTargets
        var intersectTargets = userTargets.filter(function(n) {
          return rbytrTargets.indexOf(n) !== -1;
        });
        callback(null, intersectTargets);
      });
    };
    
    /**
     * setTasks
     * 
     * @param {Function} [callback]
     */
    $scope.setTasks = function (callback) {
      $scope.getAvailableTargets(function(err, targets){
        if (err) {
          callback(err);
        } else {
          var tasks = [
            {
              targets : targets,
              datetime : '2016-10-12T23:20:00'
            }
          ];
          callback(null, tasks);
        }
      });
    };
    
    /**
     * initialForm
     * 
     * create initial - empty and untouched form
     */
    $scope.initialForm = function () {
      if ($scope.postForm) {
        $scope.postForm.$setUntouched();
      }
      delete $scope.content;
      delete $scope.files;
      delete $scope.tasks;
      $scope.setTasks(function(err, tasks){
        $scope.tasks = tasks; 
      });
    };
    if ($state.current.name === 'posts.list') {
      $scope.initialForm();
    }
    
    /**
     * addTask
     * 
     * Add new task row
     */
    $scope.addTask = function() {
      $scope.setTasks(function(err, tasks){
        $scope.tasks.push(tasks[0]);
      });
    };
    
    /**
     * create
     * 
     * @param {Boolean} isvalid - form validation
     * @param {Object} files - files object
     * 
     * Upload files if requested; create post object with or without files
     */
    $scope.create = function (isValid, files) {
      $scope.error = null;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'postForm');
        return false;
      }
      
      var tasks = [];
      angular.forEach(this.tasks, function(value, key, obj) {
        obj[key].moment = new Moment(value.datetime).format();
      });
      // Create new Post object
      var post = new Posts({
        content: $scope.content,
        tasks: $scope.tasks
      });
      
      if (files && files.length) {
        Upload.upload({
          url: 'api/uploads',
          arrayKey: '', // https://github.com/expressjs/multer/issues/274
          data: {
            files: files,
            user: $scope.authentication.user
          }
        }).then(function (resp) {
          // Add files to post object
          post.files = resp.data;
          savePost(post);
        }, function (resp) {
          // handle error
          console.log(resp);
        }, function (evt) {
          // progress notify
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
        });
      } else {
        savePost(post);
      }
    };
    
    /**
     * savePost
     *
     * @param {Object} post - the post object
     * save Post
     */
    function savePost (post) {
      post.$save(function (response) {
        $scope.initialForm();
        $scope.find();
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    }
    
    /**
     * remove
     *
     * Remove existing Post
     */
    $scope.remove = function () {
      Post.get({
        postId: this.post._id
      }, function (post, response) {
        post.$remove({
          postId: post._id
        }, function() {
          $scope.find();
        });
      });
    };
    
    /**
     * update
     * 
     * @param {Boolean} isvalid - form validation
     * Update existing Post
     */
    $scope.update = function (isValid) {
      $scope.error = null;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'postForm');
        return false;
      }
      
      var post = $scope.post;
      post.$update(function () {
        $location.path('posts/' + post._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    
    /**
     * find
     * 
     * Find a list of Posts
     */
    $scope.find = function () {
      Posts.query({ userId: $state.params.userId }).$promise.then(function (results) {
        console.log(results);
        angular.forEach(results, function(value, key, obj) {
          // convert links to 'a' tags
          var regex = /(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
          var content = obj[key].content.replace(regex, function(match){
            return '<a href="'+match+'" target="__blank">'+match+'</a>';
          });
          obj[key].content = $sce.trustAsHtml(content);
        });
        $scope.posts = results;
      });
    };
    
    /**
     * findOne
     * 
     * Find existing post by $state.params.postId
     */
    $scope.findOne = function () {
      $scope.post = Post.get({
        postId: $state.params.postId
      });
    };
    
    /**
     * openMenu
     * 
     * @param $mdOpenMenu - 
     * @param ev - 
     * 
     * Open menu
     */
    var originatorEv;
    $scope.openMenu = function($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
    };
    
    /**
     * likePost
     * 
     * Like a post 
     */
    $scope.likePost = function () {
      var self = this,
        tasks = [];
      Post.get({
        postId: self.post._id
      }, function (post, response) {
        // get available targets e.g.: ['twitter', 'linkedin']
        $scope.getAvailableTargets(function(err, targets) {
          if (err) {
            console.log(err);
          } else {
            angular.forEach(post.tasks, function (value, key, obj) {
              if (targets.indexOf(obj[key].target) > -1) {
                tasks.push(obj[key]);
              }
            });
            var like = {
              user : $scope.authentication.user,
              tasks : tasks // change this to available tasks
            };
            post.likes.push(like);
            Post.like({
              postId: post._id
            }, like, function() { // send only like, instead of complete new post
              $scope.find();
            });
          }
        });
      });
    };
    
    /**
     * unlikePost
     * 
     * Unlike a post
     */
    $scope.unlikePost = function () {
      var self = this,
        user = $scope.authentication.user;
      Post.get({
        postId: self.post._id
      }, function (post, response) {
        angular.forEach(post.likes, function (value, key, obj) {
          if (obj[key].user === user._id) {
            obj.splice(key, 1);
          } 
        });
        var like = {};
        Post.like({
          postId: post._id
        }, like, function() { // send only empty like, instead of complete new post
          $scope.find();
        });
      });
    };
    
    /**
     * sharePost
     * 
     * Share a post
     */
    $scope.sharePost = function () {
      var self = this,
        tasks = [];
      Post.get({
        postId: self.post._id
      }, function (post, response) {
        // get available targets e.g.: ['twitter', 'linkedin']
        $scope.getAvailableTargets(function(err, targets) {
          if (err) {
            console.log(err);
          } else {
            angular.forEach(post.tasks, function (value, key, obj) {
              if (targets.indexOf(obj[key].target) > -1) {
                tasks.push(obj[key]);
              }
            });
            var share = {
              user : $scope.authentication.user,
              tasks : tasks // change this to available tasks
            };
            post.shares.push(share);
            Post.share({
              postId: post._id
            }, share, function() { // send only share, instead of complete new post
              $scope.find();
            });
          }
        });
      });
    };
    
    /**
     * unsharePost
     * 
     * Unshare a post
     */
    $scope.unsharePost = function () {
      var self = this,
        user = $scope.authentication.user;
      Post.get({
        postId: self.post._id
      }, function (post, response) {
        angular.forEach(post.shares, function (value, key, obj) {
          if (obj[key].user === user._id) {
            obj.splice(key, 1);
          } 
        });
        var share = {};
        Post.share({
          postId: post._id
        }, share, function() { // send only empty share, instead of complete new post
          $scope.find();
        });
      });
    };
    
    /**
     * commentPost
     * 
     * Comment a post
     */
    $scope.commentPost = function () {};
    
    /**
     * uncommentPost
     * 
     * Uncomment a post
     */
    $scope.uncommentPost = function () {};
  }
])
.filter('contains', function() {
  return function (array, needle) {
    var container = [];
    angular.forEach(array, function (value, key, obj) {
      if (obj[key].user === needle) {
        container.push(needle);
      }
    });
    if (container.length) {
      return false;
    } else {
      return true;
    }
  };
})
.controller('ProgressController', ['$scope', '$interval', 'moment', function ($scope, $interval, Moment) {
  $scope.calcProgress = function (createdTime, execTime) {
    var created = new Moment(createdTime);
    var loaded = new Moment();
    var max = new Moment(execTime);
    var duration = max-loaded;
    var self = this, j= 0, counter = 0;
    self.mode = 'query';
    self.activated = true;
    self.modes = [ ];
    $interval(function () {
      var now = new Moment();
      $scope.progress = ((now-created) / (max-created) * 100);
      if (($scope.progress > 100) || ($scope.progress <= 0)) {
        $scope.progress = 100;
      }
    }, 100, 0, true);
  };
}]);