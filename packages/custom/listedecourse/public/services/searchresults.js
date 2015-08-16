'use strict';

angular.module('mean.listedecourse').service('searchresultService', ['$log', function($log) {
  var searchResults = [];

  var addResults = function(newObj) {
    $log.info('ADD RESULTS : ' + JSON.stringify(newObj));
    for (var i = newObj.length - 1; i >= 0; i--) {
      searchResults.push(newObj[i])
    };
  };

  var getResults = function(){
    $log.info('GET RESULTS');
    return searchResults;
  };
  
  var reset = function(){
    $log.info('RESET RESULTS');
    searchResults = [];
  };

  return {
    addResults: addResults,
    getResults: getResults,
    reset: reset
  };

}]);