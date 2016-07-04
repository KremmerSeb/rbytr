'use strict';

// Setting up route
angular.module('posts').config(['$stateProvider',
  function ($stateProvider) {
    // Posts state routing
    $stateProvider
      .state('posts', {
        abstract: true,
        url: '/posts',
        template: '<ui-view/>'
      })
      .state('posts.list', {
        url: '',
        templateUrl: 'modules/posts/client/views/list-posts.client.view.html',
        controller: 'PostsController',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('posts.create', {
        url: '/create',
        templateUrl: 'modules/posts/client/views/create-post.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('post', {
        abstract: true,
        url: '/post',
        template: '<ui-view/>'
      })
      .state('post.view', {
        url: '/:postId',
        templateUrl: 'modules/posts/client/views/view-post.client.view.html'
      })
      .state('post.edit', {
        url: '/:postId/edit',
        templateUrl: 'modules/posts/client/views/edit-post.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
