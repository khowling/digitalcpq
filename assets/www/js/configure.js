/**
 * Created by keith on 19/06/2014.
 */
var configureCtrl =  function (SFDCData, $sce, $http, $routeParams,  $resource, $scope, $rootScope, $location) {

    angular.element(document).ready(function () {
        jQuery(".ng-view").foundation();
    });
    //var url = ($rootScope.sf) && ($rootScope.sf.client.targetOrigin + $rootScope.sf.context.links.restUrl) || '/proxy';
    //console.log ('hitting : ' +url);
    //$http.get('/proxy' + '/query/?q=' + "select id, name, RecordType.Name, ThumbImage69Id__c,  Description__c from product__c where id = '" + $routeParams.id + "'")

	SFDCData.query("Product__c", "*",  [{field: "Id", equals: $routeParams.id}])
    	.then(function (data) {

            $scope.product = data[0];
            console.log ('config meta : ' + $scope.product.ConfigMetaData__c);
            $scope.productConfigMetaData = angular.fromJson($scope.product.ConfigMetaData__c);
            $scope.getRichDescroption =  function() {
                return $sce.trustAsHtml($scope.product.Description__c);
            };
            $http.get('/proxy/chatter/files/' + $scope.product.ThumbImage69Id__c)
                .success(function (cdata) {
                        $scope.productConfigPrice = 0;
                        $scope.product.imgsrc = 'https://eu2.salesforce.com' + cdata.downloadUrl;

            });

        });

    $scope.toggleAccordion = function(val) {
        if ($scope.accordion[val] == true) {
            $scope.accordion[val] = false;
            $("#panelContent" + val).slideToggle("slow");

        } else {
            $scope.accordion[val] = true;
            $("#panelContent" + val).slideToggle("slow");
            for (var i in $scope.accordion) {
                if (i !== val) {
                    if ($scope.accordion[i] == true) {
                        $("#panelContent" + i).slideToggle("slow");
                        $scope.accordion[i] = false;
                    }
                }
            }
        }
    }
    
    $scope.enableaddtocart = false;
    $scope.productConfig = { };
    $scope.addselection = function (category, val) {
        $scope.productConfig[category] = val;
        $scope.toggleAccordion(category);
        var notfinished = false;
        $scope.productConfigPrice = 0;
        for (var c in $scope.productConfigMetaData) {
            var copt = $scope.productConfigMetaData[c];
            if (copt.required && !$scope.productConfig[copt.name]) {
                notfinished = true;
            } else {
                for (vopt in copt.values) {
                    if (copt.values[vopt].name === $scope.productConfig[copt.name]) {
                        $scope.productConfigPrice += copt.values[vopt].price;
                    }
                }
            }
        }
        if (!notfinished) $scope.enableaddtocart = true;

    }
    $scope.addtobasket = function() {
        $rootScope.addBasket ($scope.product, $scope.productConfigPrice, $scope.productConfig);
        jQuery('#itemadded_modal').foundation('reveal', 'open');

    }

}
