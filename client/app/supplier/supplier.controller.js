'use strict';

angular.module('speechBubbleApp')
  .controller('SupplierCtrl', function ($scope, Supplier) {
    $scope.suppliers = Supplier.query();
  });
