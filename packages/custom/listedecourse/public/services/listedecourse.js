'use strict';

angular.module('mean.listedecourse')
	.factory('ideasService', ['$http', '$log', function($http, $log) {
		return function(scope){
				$http.get('/listedecourse/assets/static/ideas.json')
	       		.then(function(res){
	          		$log.info('Got ideas' + JSON.stringify(res.data));
	          		scope.ideas = res.data;
	    		});	
			};	
	}
]);
