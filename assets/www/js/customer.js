
var custCntl = function ($scope, $rootScope, $location, $http, SFDCData) {

    var online = true;

    $scope.search = function (stxt) {
    	SFDCData.query("Contact", "Id, FirstName, LastName, Email, Company__c, MobilePhone, MailingPostalCode",  stxt && [{field: 'LastName', like: stxt}] || null).then(function (data) {
    		console.log ('controller : ' + angular.toJson(data));
    		$scope.results =  data;
    	})
    	if (stxt && stxt.length > 5) {
    		$scope.offercreate = true;
    	}
    }
    
    $scope.selectCustomer = function(cust) {
    	$rootScope.selectedCustomer = cust;
		$location.path( "/");
    }

    $scope.submit = function () {
        $scope.errorStr = null;
        SFDCData.insert("Contact", $scope.NewCustomer).then(function (res) {
        	console.log ('got ' + angular.toJson(res));
        	if (res.id) {
        		$scope.NewCustomer.Id = res.id;
        		 $scope.selectCustomer ($scope.NewCustomer);
        	} else if (res.message) { // array
        		$scope.errorStr  = res.message;
        	}
        });
                   
    }
}
