'use strict';

angular.module('speechBubbleApp')
  .controller('AdminPageEditCtrl', function($scope, $modalInstance, Page, pages, page) {

    if(!page._revisions.length) {
      page._revisions.push({});
    }

    $scope.page = page;
    $scope.revisions = page._revisions.slice().reverse();
    $scope.revision = page._revisions[page._revisions.length -1];

    $scope.options = {
      visibility: ['hidden', 'public'],
      status: ['draft', 'published']
    };

    $scope.update = function() {
      Page.update({
        _id: $scope.page._id,
        slug: $scope.page.slug,
        visibility: $scope.page.visibility,
        comments: $scope.page.comments,
        title: $scope.revision.title,
        content: $scope.revision.content,
        status: $scope.revision.status
      }, function(res) {
        pages = Page.query(function() {
          $modalInstance.dismiss();
        });
      });
    };

    $scope.cancel = function() {
      $modalInstance.dismiss();
    };

    $scope.$watch('page.slug', function() {
      $scope.url = (window.location.origin + '/' + $scope.page.slug);
    });

  });
