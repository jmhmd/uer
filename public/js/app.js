'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/splash',
      controller: 'splashCtrl'
    })
    .when('/login',{
      templateUrl: 'partials/login',
      controller: 'loginCtrl'
    })
    .when('/modules', {
      templateUrl: 'partials/modules',
      controller: 'modulesCtrl'
    })
    .when('/modules/:module_id', {
      templateUrl: 'partials/module',
      controller: 'moduleCtrl'
    })
    .otherwise({
      redirectTo: '/'
    })

  $locationProvider.html5Mode(true)
})
