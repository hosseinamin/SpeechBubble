'use strict';

angular.module('speechBubbleApp')

.controller('ProductsCtrl', function ($scope, Auth, $modal, $rootScope) {
  $scope.endpoint = '/api/product/:id';
  $scope.isLoggedIn = Auth.isLoggedIn;

  $scope.create = function() {
    var modalInstance = $modal.open({
      templateUrl: 'app/admin/products/create.html',
      controller: 'AdminProductCreateCtrl'
    });

    modalInstance.result.then(function() {
      $rootScope.$broadcast('resultsUpdated');
    }, function() {
      $rootScope.$broadcast('resultsUpdated');
    });
  };
})

.controller('ProductDetailCtrl', function($scope, product, ProductTemplate, $modal, Auth) {
  $scope.isLoggedIn = Auth.isLoggedIn;

  $scope.product = product.data;
  $scope.comments = true;

  $scope.edit = function(product) {

    var modal = ProductTemplate(product);

    $modal.open({
      templateUrl: modal.template,
      controller: modal.controller,
      size: 'lg',
      resolve: {
        current: function() {
          return product;
        }
      }
    });
  };

});
