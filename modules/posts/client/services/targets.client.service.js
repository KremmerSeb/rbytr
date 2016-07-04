'use strict';

//Tasks service used for communicating with the tasks REST endpoints
angular.module('posts').factory('Targets', ['$resource',
  function ($resource) {
    return $resource('api/requests/targets');
  }
]);
