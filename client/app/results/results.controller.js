'use strict';

angular.module('speechBubbleApp')
  .controller('ResultsCtrl', function ($scope, $resource, $location, Modal, growl, $sce, ProductSearch) {

    var api = $resource($scope.endpoint, { id: '@_id' }, { query: { method: 'GET' } });

    $scope.isLoading = false;
    $scope.total = 0;
    $scope.search = ProductSearch;
    
    var changeLocation = function(now, then) {
      console.log($scope.search);
      if(now.page === then.page) {
        now.page = 1;
      }
      var location = angular.copy($scope.search);
      location.facets = _.compactObject(location.facets).keys().value();
      if(location.page === 1) {
        delete location.page;
      }
      if(location.limit === 10) {
        delete location.limit;
      }
      if(!location.type) {
        delete location.type;
      }
      $location.search(location);
    };
    
    $scope.$watch('search', changeLocation, true);

    var fetch = _.debounce(function() {
      $scope.isLoading = true;
      var facets = _.compactObject($scope.search.facets).keys().value();
      var query = angular.extend({}, $scope.search, { 'facets': facets });

      api.query(query, function(res) {
        $scope.isLoading = false;
        $scope.items = res.items;
        $scope.total = res.total;
      }, function(err) {
        $scope.isLoading = false;
        growl.error(err);
      });
    }, 100);

    $scope.getThumbnail = function(item) {
      return $sce.trustAsResourceUrl( item.images.length && item.images[0].url || '/assets/images/products/default-thumbnail.png' );
    };

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
