'use strict';

// Posts service used for communicating with the posts REST endpoints
angular.module('posts').factory('Posts', [ '$resource', function($resource) {
  return $resource('api/posts/:userId', {
    userId : '@_id'
  });
}]);

// http://stackoverflow.com/questions/15161349/multiple-routing-urls-for-single-service-angularjs
// https://docs.angularjs.org/api/ngResource/service/$resource
angular.module('posts').factory('Post', [ '$resource', function($resource) {
  return $resource('api/post/:postId', {}, {
    update : { 
      method : 'PUT' 
    },
    like : {
      method : 'PUT',
      url : 'api/post/:postId/like'
    },
    share : {
      method : 'PUT',
      url : 'api/post/:postId/share'
    },
    comment : {
      method : 'PUT',
      url : 'api/post/:postId/comment'
    }
  });
}]);
