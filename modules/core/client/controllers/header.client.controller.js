'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus',
  function ($scope, $state, Authentication, Menus) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
    
    (function() {

      function createMenu() {
        var $drawerBtn = $('.menu-btn');
        var $cloak = $('#content-cloak');
        var $item = $('.item');

        var open = false;

        function toggleMenu(toggle) {
          if (typeof toggle !== 'undefined') {
            if ((open && toggle) || (!open && !toggle)) {
              return;
            }
          }
          open = !open;

          $('body').toggleClass('no-scroll', open);
          // delay to avoid transition bug in FF when overflow on parent is changed
          setTimeout(function() {
            $('body').toggleClass('open-off-canvas', open);
          }, 16);
        }
        $drawerBtn.on('click', function(e) {
          e.preventDefault();
          toggleMenu();
        });
        $cloak.on('click', function() {
          toggleMenu(false);
        });
        $scope.closeNav = function() {
          toggleMenu(false);
        };
      }
      $(function() {
        createMenu();
      });
    })();

  }
]);
