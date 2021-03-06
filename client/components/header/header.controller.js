'use strict';

angular.module('speechBubbleApp')
  .controller('HeaderCtrl', function ($scope, $location, $http, Auth, ProductSearch, $state, $timeout) {
	  $scope.search = angular.copy(ProductSearch);

	  $scope.submit = function(term, event) {
      var term = term || '';
      if(event) {
        event.preventDefault();
      }
      if(!term) {
        $scope.applyFilters();
        $state.go('products');
      }
		  return $location.url('/products').search({ 'term': term  })
	  };

    $scope.clearSearchRetainType = function() {
      var s = $scope.search;
      delete s.page;
      delete s.limit;

      angular.forEach(s.facets, function(value, key) {
        delete s.facets[key];
      });
    };

    $scope.getSimilar = function(term) {
      return $http.get('/api/product/similar', {
        params: {
          term: term
        }
      }).then(function(res) {
        return res.data;
      });
    };

    $scope.applyFilters = function() {
      $scope.status.isopen = false;
      angular.copy($scope.search, ProductSearch);
    };

    $scope.clearFilters = function() {
      $state.go('products');
      $timeout(function() {
        $scope.search = angular.copy(ProductSearch);
      });
    };

  });
