'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$state', 'Authentication',
  function ($scope, $state, Authentication) {
    $scope.user = Authentication.user;
    $scope.$state = $state;
  }
]);
