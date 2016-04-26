/*
 * 
 * author: sandeep.mogla@gmail.com
 */
var app = angular.module('maritimeApp', ['ui.bootstrap', 'ngFileUpload']);

app.filter('startFrom', function () {
    return function (input, start) {
        if (input) {
            start = +start; //parse to int
            return input.slice(start);
        }
        return [];
    }
});
app.controller('mainCrtl', function ($scope, $http, $timeout, $modal, fileUpload) {
    $http.get('/api/listVassels').success(function (data) {
        $scope.list = data;
        $scope.currentPage = 1; //current page
        $scope.entryLimit = 20; //max no of items to display in a page
        $scope.filteredItems = $scope.list.length; //Initially for no filter
        $scope.totalItems = $scope.list.length;
    });
    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };
    $scope.filter = function () {
        $timeout(function () {
            $scope.filteredItems = $scope.filtered.length;
        }, 10);
    };
    $scope.sort_by = function (predicate) {
        $scope.predicate = predicate;
        $scope.reverse = !$scope.reverse;
    };

    $scope.uploadFile = function () {
        var file = $scope.myFile;

        console.log('file is ');
        console.dir(file);

        var uploadUrl = "/api/upload";
        fileUpload.uploadFileToUrl(file, uploadUrl);
    };

    $scope.open = function () {
        console.log('opening pop up');
        var modalInstance = $modal.open({
            templateUrl: 'modalUpload.html',
            controller: 'uploadCtrl'
        });
    }
});

app.controller('uploadCtrl', function ($scope, $modalInstance, $timeout, Upload, fileUpload) {
    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.uploadFile = function () {
        var file = $scope.myFile;

        console.log('file is ');
        console.dir(file);

        var uploadUrl = "/api/upload";
        fileUpload.uploadFileToUrl(file, uploadUrl);
    };

    $scope.uploadFiles = function (file, errFiles) {
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        if (file) {
            file.upload = Upload.upload({
                url: 'http://localhost:8081/api/upload',
                data: {
                    file: file
                }
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    file.result = response.data;
                });
            }, function (response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                    evt.loaded / evt.total));
            });
        }
    }
});


app.service('fileUpload', ['$http', function ($http) {
    this.uploadFileToUrl = function (file, uploadUrl) {
        var fd = new FormData();
        fd.append('file', file);

        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        })

        .success(function () {
            console.log('success');

        })

        .error(function () {
            console.log('error');
        });
    }
}]);

app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope.$parent, element[0].files[0]);
                });
            });
        }
    };
}]);
