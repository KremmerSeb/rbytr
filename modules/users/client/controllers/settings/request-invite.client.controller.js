'use strict';

angular.module('users').controller('RequestInviteController', ['$scope', '$state', '$http', 'Authentication',
  function ($scope, $state, $http, Authentication) {
    $scope.requestInvite = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }
      $http.post('/api/auth/invite', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);
