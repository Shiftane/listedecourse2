/*global $:false */
'use strict';

angular.module('mean.listedecourse').controller('ListedecourseController', ['$scope', '$log', '$http', 'Global', 'ideasService','$modal','$sce', '$analytics', '$location', '$stateParams',
  function($scope, $log, $http, Global, ideasService, $modal, $sce, $analytics, $location, $stateParams) {
    $scope.global = Global;
    $scope.package = {
      name: 'listedecourse'
    };
    

    $scope.init = function(){
        $scope.NumberOfRecipe = 0;
        $scope.NumberOfIngredient = 0;

        $log.info('INIT : ' + JSON.stringify($stateParams));
        
        if($stateParams.searchTerm){
            $log.info('SEARCH');
            this.query = $stateParams.searchTerm;
            $scope.search();
        }

        if($stateParams.recipeUrl && $stateParams.providerName){
            $log.info('RECIPE');
            $scope.getRecipe($stateParams.recipeURL, $stateParams.providerName);
        }
        ideasService($scope);
        $log.info('END INIT : ' + $scope.ideas);

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

    $scope.search = function(){
        $('searchResults').removeClass('hidden-xs');
        $analytics.pageTrack('search/'+this.query);
        $location.path('/listedecourse/search/'+this.query);
    	$log.info('Search for query : ' + this.query);
        // TODO Waiting screen
        $('body').addClass('loading');
        $scope.results = [];
    	$http.get('/recipeprovider/search/' + this.query).
		  success(function(data, status, headers, config) {
		  	$scope.results = data;
		  	$log.info($scope.results);
            $('body').removeClass('loading');
		  }).
		  error(function(data, status, headers, config) {
            // TODO RETURN MESSAGE ERROR
		    $scope.results = {};
            $('body').removeClass('loading');
		 });
    };

    $scope.getRecipe = function(recipeUrl, recipeProviderName){
        $('body').addClass('loading');
        $('searchResults').addClass('hidden-xs');
        $analytics.pageTrack('recipe/'+recipeProviderName+'/' + recipeUrl);
        $location.path('/listedecourse/search/'+this.query+'/'+recipeProviderName+'/' + recipeUrl);
    	$log.info('Get Recipe : ' + recipeProviderName + ' | ' + recipeUrl);

    	$http.get('/recipeprovider/recette/' + recipeProviderName + '/' + encodeURIComponent(recipeUrl)).
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
		  	$log.info($scope.recipe);
            $scope.num = parseInt($scope.recipe.result.contenu.nbrPersons);
            $scope.oldNbrPersons = parseInt($scope.recipe.result.contenu.nbrPersons);
            $log.info('newNbrPersons : ' + $scope.recipe.result.contenu.nbrPersons);
            $('body').removeClass('loading');
		  }).
		  error(function(data, status, headers, config) {
		    $('body').removeClass('loading');
		 });
    };
    /*
    $scope.$watch('num', function(){
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
    });
*/
    $scope.$watch('NumberOfRecipe', function(){
        $log.info('NumberOfRecipe Change');
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
    		$http.put('/listedecourses/'+$scope.listedecourse._id, $scope.listedecourse).
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
	    	$http.post('/listedecourses', listedecourse).
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

    $scope.loading = function(divId){
        $('#' + divId).style('border','1px solid black');
    };
  }
]);
