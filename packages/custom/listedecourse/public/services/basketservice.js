'use strict';

angular.module('mean.listedecourse')
	.factory('basketService', ['$http', '$log', '$rootScope', function($http, $log, $rootScope) {
		var basket = [];
		
		var addRecipe = function(recipe){
			basket.push(recipe);
			$rootScope.$broadcast('basketUpdate');
		};
		
		var getBasket = function(){
			return basket;
		};
		var clearBasket = function(){
			basket.clear();
		};
		var getBasketSize = function(){
			return basket.length;
		};
		return {
			addRecipe: addRecipe,
			getBasket: getBasket,
			getBasketSize:getBasketSize,
			clearBasket: clearBasket
		};
	}
]);
