/*global $:false */
'use strict';

angular.module('mean.listedecourse').controller('IdeasController', ['$scope', '$log', '$http', 'Global', 'ideasService','$modal','$sce', '$analytics', '$location', '$stateParams',
  function($scope, $log, $http, Global, ideasService, $modal, $sce, $analytics, $location, $stateParams) {
    $scope.global = Global;
    $scope.package = {
      name: 'ideas'
    };

    $scope.init = function(){

        ideasService($scope);
        $log.info('END INIT IDEA : ' + $scope.ideas);
    };


  }
]);

angular.module('mean.listedecourse').controller('MenuController', ['$state', '$scope', '$rootScope', '$log', 'basketService', '$http', 'Global', 'searchresultService','$modal','$sce', '$analytics', '$location', '$stateParams',
  function($state, $scope, $rootScope, $log, basketService, $http, Global, searchresultService, $modal, $sce, $analytics, $location, $stateParams) {
    $scope.global = Global;
    $scope.package = {
      name: 'menu'
    };

    $scope.NumberOfRecipe = basketService.getBasketSize();
    $scope.NumberOfIngredient = 0;

    $scope.$on('updateSearchTerm', function(event, data){
        $scope.query = data.searchTerm;
        $log.info('SearchTerm updated ' + data.searchTerm);
        $scope.search();
    });
    
    $rootScope.$on('addRecipeInBasket', function(event, recipe) {
      $log.info('Recipe : ' + JSON.stringify(recipe));
      $scope.saveRecetteInListeDeCourse(recipe);
    });

    $scope.saveRecetteInListeDeCourse = function(recipe){
        $analytics.pageTrack('saverecipe');
        // Animate button with number of recipe added
        $log.info('Je vais sauver cette liste d\'ingrédients : ' + JSON.stringify(recipe));
        basketService.addRecipe(recipe);

    };
    
    $rootScope.$on('basketUpdate', function(){
      $scope.NumberOfRecipe = basketService.getBasketSize();
      
      $('.navbar-static-top button').animate(
            {opacity: '0.2'}, 'slow'
            ).animate(
            {opacity: '1'}, 'slow'
            );
        $('.navbar-static-top button span').animate(
            {'font-weight': 'bold', 'color' : '#dd0000'}, 'slow'
            ).animate(
            {'font-weight': 'none', 'color' : '#428bca'}, 'slow'
            );
    });

    $scope.search = function(){
        searchresultService.reset();
        var searchTerm = $scope.query
        $('searchResults').removeClass('hidden-xs');
        $analytics.pageTrack('search/'+searchTerm);
        $location.path('/listedecourse/search/'+searchTerm);
        $log.info('Search for query : ' + searchTerm);
        // TODO Waiting screen
        $('body').addClass('loading');
        $http.get('/api/recipeprovider/search/' + searchTerm).
          success(function(data, status, headers, config) {
            $log.info('Get from API search : ' + JSON.stringify(data));
            searchresultService.addResults(data.results);
            $rootScope.$broadcast('searchResults');
            $('body').removeClass('loading');
          }).
          error(function(data, status, headers, config) {
            // TODO RETURN MESSAGE ERROR
            searchresultService.reset();
            $('body').removeClass('loading');
         });
    };

    $scope.open = function (size) {
        $analytics.pageTrack('openRecipe');
        var modalInstance = $modal.open({
          templateUrl: '/listedecourse/views/myModal.html',
          controller: 'ModalInstanceController',
          size: size,
          resolve: {
            listedecourse: function () {
              return $scope.listedecourse;
            }
          }
        });

        modalInstance.result.then(function (selectedItem) {
          $scope.selected = selectedItem;
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });
    };
    
  }
]);


angular.module('mean.listedecourse').controller('SearchresultsController', 
    ['$scope', '$rootScope', '$log', '$http', 'Global', 'searchresultService', '$modal','$sce', '$analytics', '$location', '$stateParams',
  function($scope, $rootScope, $log, $http, Global, searchresultService, $modal, $sce, $analytics, $location, $stateParams) {
    $scope.global = Global;
    $scope.results = [];
    $scope.nbrPersons = 0;

    $scope.package = {
      name: 'searchresults'
    };


    $scope.$on('searchResults', function(){        
        $scope.search()
    });

    $scope.search = function(){
        $scope.results = searchresultService.getResults();
    };

    $scope.init = function(){
        $log.info('Search Results Initialized '+ $stateParams.searchTerm);
        $rootScope.$broadcast('updateSearchTerm', {searchTerm : $stateParams.searchTerm});
    };

    $scope.getRecipe = function(recipeUrl, recipeProviderName){
        $('body').addClass('loading');
        $('searchResults').addClass('hidden-xs');
        $analytics.pageTrack('recipe/'+recipeProviderName+'/' + recipeUrl);
        $log.info('Get Recipe : ' + recipeProviderName + ' | ' + recipeUrl);

        $http.get('/api/recipeprovider/recette/' + recipeProviderName + '/' + encodeURIComponent(recipeUrl)).
          success(function(data, status, headers, config) {
            $log.info('data ' + JSON.stringify(data));
            $rootScope.$broadcast('updateRecipe',data);
          }).
          error(function(data, status, headers, config) {
            $('body').removeClass('loading');
         });
    };

    $scope.show = function(index){
        $log.info('Show me this recipe : ' + index);
        $scope.recetteToShow = $scope.listedecourse.recettes[index];  
        $scope.allIngredients = false;      
    };
  }
]);



angular.module('mean.listedecourse').controller('RecipeController', 
    ['$scope', '$rootScope', '$log', '$http', 'Global', 'searchresultService','$modal','$sce', '$analyticsProvider', '$location', '$stateParams',
  function($scope, $rootScope, $log, $http, Global, searchresultService, $modal, $sce, $analyticsProvider, $location, $stateParams) {
    $scope.global = Global;
    $scope.package = {
      name: 'recipedetails'
    };

    $scope.input = {num:0};

    $scope.init = function(){
        $log.info('Recipe Initialized ');
    };

    $rootScope.$on('updateRecipe', function(event, data){
        if($scope.recipe && $scope.recipe.result && $scope.recipe.result.image){
                $log.info('before ' + $scope.recipe.result.image);
                
                $log.info('delete image');
                delete $scope.recipe.result.image;    
                $log.info('after ' + $scope.recipe.result.image);
            }
            
            $scope.recipe = data;
            $scope.recipe.result.descriptionSafe = $sce.trustAsHtml(data.result.description);
            delete $scope.recipe.result.description;
            $log.info('Recipe value ' + JSON.stringify($scope.recipe));
            $scope.nbrPersons = parseInt($scope.recipe.result.contenu.nbrPersons);
            $scope.oldNbrPersons = parseInt($scope.recipe.result.contenu.nbrPersons);
            $scope.input.num = $scope.nbrPersons;
            $log.info('newNbrPersons : ' + $scope.recipe.result.contenu.nbrPersons);
            $('body').removeClass('loading');
    });
    
    $scope.addRecipe = function(){
      $rootScope.$broadcast('addRecipeInBasket', $scope.recipe.result);
    };
    
    $scope.changeNbrPerson = function(){
        var nbrPersons = $scope.oldNbrPersons;
        $log.info('NbrPersons : ' + nbrPersons + ' New : ' + $scope.num);
        var inputNbrPersons = $scope.input.num;
        if($scope.recipe){
            $scope.recipe.result.contenu.nbrPersons = $scope.input.num;
            $scope.recipe.result.contenu.ingredients.forEach(function(element, index){
                var quantity = element.quantity / nbrPersons * inputNbrPersons;
                $log.info('new Final quantity for ' + element.product + ' = ' + quantity);
                element.quantity = quantity;
            });
            $scope.oldNbrPersons = inputNbrPersons;
            $scope.$apply();
        }
    };

  }
]);

