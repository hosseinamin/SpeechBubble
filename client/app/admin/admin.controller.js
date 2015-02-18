'use strict';

angular.module('speechBubbleApp')
  .controller('AdminCtrl', function ($scope, $http, Auth, User) {

    // Use the User $resource to fetch all users
    $scope.users = User.query();
    $scope.roles = ['admin', 'user'];

    $scope.delete = function(user) {
      User.remove({ id: user._id });
      angular.forEach($scope.users, function(u, i) {
        if (u === user) {
          $scope.users.splice(i, 1);
        }
      });
    };

    $scope.updateStatus = function(user) {
      User.updateStatus(user);
    };

    $scope.updateRole = function(user) {
      User.updateRole(user);
    };

  });
