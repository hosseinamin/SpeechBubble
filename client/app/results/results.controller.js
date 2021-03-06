'use strict';

angular.module('speechBubbleApp')
  .controller('ResultsCtrl', function ($scope, $resource, $location, Modal, growl, $sce, ProductSearch, FancyFacets) {

    var api = $resource($scope.endpoint, { id: '@_id' }, { query: { method: 'GET' } });

    $scope.isLoading = false;
    $scope.total = 0;
    $scope.search = ProductSearch;
    $scope.initial = true;

    var changeLocation = function(now, then) {
      var location = angular.copy($scope.search);
      location.facets = FancyFacets(location.facets);
      if(location.page === 1) {
        delete location.page;
      }
      if(location.limit === 10) {
        delete location.limit;
      }
      if(!location.type) {
        delete location.type;
      }
      if(!location.term) {
        delete location.term;
      }
      $location.search(location);
    };

    $scope.clearFilters = function() {
      angular.copy({}, ProductSearch.facets);
    };

    $scope.hasFacets = function() {
      var location = angular.copy($scope.search);
      location.facets = FancyFacets(location.facets);
      return !!location.facets.length;
    };

    $scope.getItemsPerPage = function() {
      return $scope.search.limit || 10;
    };

    $scope.$watch('search', changeLocation, true);

    var fetch = _.debounce(function() {
      $scope.isLoading = true;
      var facets = _.compactObject($scope.search.facets).keys().value();
      var query = angular.extend({}, $scope.search, { 'facets': facets });

      api.query(query, function(res) {
        $scope.initial = false;
        $scope.isLoading = false;
        $scope.items = res.items;
        $scope.total = res.total;
      }, function(err) {
        $scope.initial = false;
        $scope.isLoading = false;
        growl.error(err);
      });
    }, 100);

    $scope['delete'] = Modal.confirm['delete'](function(item) {
      api.remove({ id: item._id });
      angular.forEach($scope.items, function(current, index) {
        if (current === item) {
          $scope.items.splice(index, 1);
        }
      });
    });

    $scope.$on('resultsUpdated', fetch);
    $scope.$watch('search', fetch, true);

  });
