'use strict';
var custCntl = function ($scope, $rootScope, $location, $http, $routeParams, SFDCData) {

	$scope.baskets = [];
	$scope.results =  [];
	$scope.offercreate = false;
	$scope.shownewform = false;
	
	$rootScope.$watch('online', function(val) {
		console.log ('custCntl online change ' + val);
    	$scope.custonline = $rootScope.online;
    });
	
	$scope.search = function (stxt) {
    	SFDCData.query("Contact", "*",  stxt && [{field: 'LastName', like: stxt}] || null)
    		.then(function (data) {
	    		console.log ('controller : ' + angular.toJson(data));
	    		$scope.results =  data;
	    	})
    	if (stxt && stxt.length > 2) {
    		$scope.offercreate = true;
    	}
    }
	
	var getLocal = function() {
		SFDCData.queryLocal("Contact", "*",  [{field: 'Id', equals: 'LOCAL'}])
		.then (function (data) {
			console.log ('controller : ' + angular.toJson(data));
			// get any sync error
			$scope.results =  data;
			SFDCData.queryLocal("Order__c", "*",  [{field: 'Id', equals: 'LOCAL'}])
			.then (function (data) {
				for (bidx in data) {
					console.log ('got basket data : ' + data[bidx].OrderMetaData__c);
					data[bidx].OrderMetaData__c = angular.fromJson(data[bidx].OrderMetaData__c);
				}
				$scope.baskets =  data;
			});
		});
	}
	
	if ($routeParams.sync) {
		$scope.sync = true;
		getLocal();
	}
	
	
	$scope.edit = function (o1) {
		$scope.NewCustomer = o1;
		$scope.shownewform = true;
	}
	

    $scope.selectCustomer = function(cust) {
    	if ($scope.sync == true) {
    		// one less to sync
    		$scope.shownewform = false;
    		SFDCData.rmSyncError("Contact", cust._soupEntryId);

    	} else {
    		$rootScope.selectedCustomer = cust;
    		var fromURL = $routeParams.fromURL;
    		if (!fromURL) {
    			$location.path( "/");
    		} else {
    			$location.path(fromURL);
    		}
    	}
    }
    
    $scope.reinitialiseSoup = function (){
    	if (confirm("Are you sure!")) {
    		$scope.reinit_wait = true;
	    	SFDCData.reinitialiseSoup().then(function (val) {
	    		$scope.reinit_wait = false;
	    		alert (val);
	    	});
    	}
    }
    $scope.syncout = function() {
    	$scope.waiting = true;
    	
    	SFDCData.initSyncinfo();
    	$scope.syncstatus = "save Contacts";
    	SFDCData.syncup ("Contact").then(function () {
    		$scope.syncstatus = "save Orders";
    		SFDCData.syncup ("Order__c").then(function () {
    			$scope.syncstatus = "refresh Contacts";
    			SFDCData.query ("Contact",  "*", null).then(function () {
    				$scope.syncstatus = "refresh Products";
	    			SFDCData.query ("Product__c", "*", null).then(function () {
	    				$scope.syncstatus = "upto date";
	    				$scope.waiting = false;
	    				getLocal();
	    			});
    			});
    		});
    	});
    }

    $scope.submit = function () {
        $scope.errorStr = null;
        SFDCData.insert("Contact", $scope.NewCustomer).then(function (res) {
        	console.log ('got ' + angular.toJson(res));
        	if (res.id) {
        		$scope.NewCustomer.Id = res.id;
        		$scope.selectCustomer ($scope.NewCustomer);
        	} else if (res._soupEntryId) {
        		$scope.NewCustomer._soupEntryId = res._soupEntryId;
        		$scope.selectCustomer ($scope.NewCustomer);
        	} else  { // array
        		$scope.errorStr = 'Didnt Save';
        		if (res.message) {
        			$scope.errorStr  += ': ' + res.message;
        		}
        	}
        });
                   
    }
}
