'use strict';

angular.module('mean.listedecourse').config(['$stateProvider','$locationProvider',
  function($stateProvider, $location) {
  	//$location.html5Mode(html5pushstate);
    //$location.hashPrefix('');

    $stateProvider.state('Homepage', {
      url: '/listedecourse/home',
      templateUrl: 'listedecourse/views/index.html'
    })
    .state('Search', {
      url: '/listedecourse/search/:searchTerm',
      templateUrl: 'listedecourse/views/index.html',
      controller : 'ListedecourseController'
    })
    .state('Recipe', {
      url: '/listedecourse/search/:searchTerm/:providerName/:recipeUrl',
      templateUrl: 'listedecourse/views/index.html',
      controller : 'ListedecourseController'
    });
    
  }
]);
