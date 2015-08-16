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

angular.module('mean.listedecourse').controller('MenuController', ['$state', '$scope', '$rootScope', '$log', '$http', 'Global', 'searchresultService','$modal','$sce', '$analytics', '$location', '$stateParams',
  function($state, $scope, $rootScope, $log, $http, Global, searchresultService, $modal, $sce, $analytics, $location, $stateParams) {
    $scope.global = Global;
    $scope.package = {
      name: 'menu'
    };

    $scope.NumberOfRecipe = 0;
    $scope.NumberOfIngredient = 0;

    $scope.$on('updateSearchTerm', function(event, data){
        $scope.query = data.searchTerm;
        $log.info('SearchTerm updated ' + data.searchTerm);
        $scope.search();
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
    ['$scope', '$rootScope', '$log', '$http', 'Global', 'searchresultService','$modal','$sce', '$analytics', '$location', '$stateParams',
  function($scope, $rootScope, $log, $http, Global, searchresultService, $modal, $sce, $analytics, $location, $stateParams) {
    $scope.global = Global;
    $scope.results = [];
    $scope.num = 0;
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
        //$location.path('/listedecourse/search/'+this.query+'/'+recipeProviderName+'/' + recipeUrl);
        $log.info('Get Recipe : ' + recipeProviderName + ' | ' + recipeUrl);

        $http.get('/api/recipeprovider/recette/' + recipeProviderName + '/' + encodeURIComponent(recipeUrl)).
          success(function(data, status, headers, config) {
            $log.info('recipe ' + $scope.recipe);
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
            $scope.num = parseInt($scope.recipe.result.contenu.nbrPersons);
            $scope.oldNbrPersons = parseInt($scope.recipe.result.contenu.nbrPersons);
            $log.info('newNbrPersons : ' + $scope.recipe.result.contenu.nbrPersons);
            $('body').removeClass('loading');

          }).
          error(function(data, status, headers, config) {
            $('body').removeClass('loading');
         });
    };


    
    $scope.changeNbrPerson = function(){
        var nbrPersons = $scope.oldNbrPersons;
        $log.info('NbrPersons : ' + nbrPersons + ' New : ' + $scope.num);
        var inputNbrPersons = $scope.num;
        if($scope.recipe){
            $scope.recipe.result.contenu.nbrPersons = $scope.num;
            $scope.recipe.result.contenu.ingredients.forEach(function(element, index){
                var quantity = element.quantity / nbrPersons * inputNbrPersons;
                $log.info('new Final quantity for ' + element.product + ' = ' + quantity);
                element.quantity = quantity;
            });
            $scope.oldNbrPersons = inputNbrPersons;
        }
    };

    $scope.$watch('NumberOfRecipe', function(){
        $log.info('NumberOfRecipe Change');
    });
    $scope.$watch('recipe', function(newVal){
        $log.info('recipe Change ' + newVal);
    });
    $scope.saveRecetteInListeDeCourse = function(){
        $analytics.pageTrack('saverecipe');
        // Animate button with number of recipe added
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

        if($scope.listedecourse){
            $scope.recipe.result.contenu.nbrPersons = $scope.num;
            $scope.listedecourse.recettes.push($scope.recipe.result);
            $log.info('Je vais mettre à jour cette liste d\'ingrédients : ' + $scope.listedecourse._id );
            $http.put('/api/listedecourses/'+$scope.listedecourse._id, $scope.listedecourse).
              success(function(data, status, headers, config) {
                $log.info('SUPER CA MARCHE = ' + JSON.stringify(data));
                $scope.listedecourse = data;
                $scope.NumberOfRecipe = $scope.listedecourse.recettes.length;
              }).
              error(function(data, status, headers, config) {
                $log.info('THATS SUCKS !!! = ' + JSON.stringify(data));
             });
            //$scope.NumberOfIngredient = ;
        }else{
            var listedecourse = {};
            listedecourse.name = 'Default';
            listedecourse.recettes = [];
            listedecourse.recettes.push($scope.recipe.result);
            $log.info('Je vais sauver cette liste d\'ingrédients : ' + JSON.stringify(listedecourse));
            $http.post('/api/listedecourses', listedecourse).
              success(function(data, status, headers, config) {
                $log.info('SUPER CA MARCHE = ' + JSON.stringify(data));
                $scope.listedecourse = data;
                $scope.NumberOfRecipe = $scope.listedecourse.recettes.length;
              }).
              error(function(data, status, headers, config) {
                $log.info('THATS SUCKS !!! = ' + JSON.stringify(data));
             });

        }

    };
    $scope.show = function(index){
        $log.info('Show me this recipe : ' + index);
        $scope.recetteToShow = $scope.listedecourse.recettes[index];  
        $scope.allIngredients = false;      
    };
  }
]);



angular.module('mean.listedecourse').controller('RecipeController', 
    ['$scope', '$rootScope', '$log', '$http', 'Global', 'searchresultService','$modal','$sce', '$analytics', '$location', '$stateParams',
  function($scope, $rootScope, $log, $http, Global, searchresultService, $modal, $sce, $analytics, $location, $stateParams) {
    $scope.global = Global;
    $scope.package = {
      name: 'recipedetails'
    };

    $scope.num = 0;

    $scope.init = function(){
        $log.info('Recipe Initialized ');
    };

    
    $scope.changeNbrPerson = function(){
        var nbrPersons = $scope.oldNbrPersons;
        $log.info('NbrPersons : ' + nbrPersons + ' New : ' + $scope.num);
        var inputNbrPersons = $scope.num;
        if($scope.recipe){
            $scope.recipe.result.contenu.nbrPersons = $scope.num;
            $scope.recipe.result.contenu.ingredients.forEach(function(element, index){
                var quantity = element.quantity / nbrPersons * inputNbrPersons;
                $log.info('new Final quantity for ' + element.product + ' = ' + quantity);
                element.quantity = quantity;
            });
            $scope.oldNbrPersons = inputNbrPersons;
        }
    };

  }
]);

