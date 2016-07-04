'use strict';
angular
.module('core')
.controller('DemoController', DemoController)
.directive('mousemove', mousemove);

DemoController.$inject = ['$scope', '$timeout', '$interval'];
function DemoController($scope, $timeout, $interval) {
  $scope.loc = -1700;
  $scope.speed = 100;
  var trans = function () {
    // direction
    if($scope.mouseDiff < 0){
      $scope.loc--; 
    }else{
      $scope.loc++;
    }
    // set location
    $scope.transY = 'translateY('+$scope.loc+'px)';
    // jump location if image ends
    if($scope.loc>=-280){
      $scope.loc = -1700;
    }else{
      $scope.loc = $scope.loc;
    }
    if($scope.loc<-1700){
      $scope.loc = -280;
    }else{
      $scope.loc = $scope.loc;
    }
    // change interval (=speed) based on $scope.speed
    var interval = $interval(trans, $scope.speed);
    // cancel former interval 
    $timeout(function(){
      $interval.cancel(interval);
    }, $scope.speed);
  };
  trans();
}

mousemove.$inject = ['$timeout', '$window'];
function mousemove($timeout, $window) {
  var location = 0;
  return {
    link: function($scope) {
      var onMouseMove = function(e) {
        var device = document.getElementsByClassName('mobileLandingDemo__static')[0],
          coords = device.getBoundingClientRect(),
          currentCenterLocationY = coords.bottom-(device.height/2);
        // difference between mouseY location and device center
        $scope.mouseDiff = e.clientY-currentCenterLocationY;
        // speed
        if($scope.mouseDiff > 0){
          $scope.speed = -(1/10)*($scope.mouseDiff)+100;
        }else{
          $scope.speed = (1/10)*($scope.mouseDiff)+100;
        }
      };
      angular.element($window).on('mousemove', onMouseMove);
      $scope.$on('$destroy', function (e) {
        angular.element($window).off('mousemove', onMouseMove);
      });
    }
  };
}
