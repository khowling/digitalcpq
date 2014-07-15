
var custCntl = function ($scope, $http, SFDCData) {

    var online = true;

    $scope.search = function (stxt) {
    	SFDCData.query("Contact", "id, name, email, account.name, MobilePhone, MailingPostalCode",  stxt && {field: 'Name', like: stxt} || null).then(function (data) {
    		console.log ('controller : ' + angular.toJson(data));
    		$scope.results =  data;
    	})
    	if (stxt && stxt.length > 5) {
    		$scope.offercreate = true;
    	}
    	
    	/*
        if (online) {
            var qstr = sf_host_url + sfdc_api_version + "/query/?q=" + "select id, name, email, account.name, MobilePhone, MailingPostalCode from contact";
            if (stxt && stxt.length > 0) {
                qstr += " where name like '" + stxt + "%25'"
                qstr += " or account.name like '" + stxt + "%25'"
            }
            $http.get(qstr,
                {
                    headers: {
                        'Authorization': 'OAuth ' + session_api
                    }
                }).success(function (data) {
                    $scope.results = data.records;
                    mockStore.upsertSoupEntries('Contact', data.records, "Id");
                });
        } else {
            $scope.results =  mockStore.smartQuerySoupFull ({smartSql: "SELECT {Contact:_soup} FROM {Contact} WHERE {Contact:Name} LIKE '"+stxt+"' ORDER BY LOWER({Contact:Name})"});

        }
        $scope.offercreate = true;
        */
    }

    $scope.submit = function () {
        $scope.errorStr = null;
        SFDCData.insert("Contact", $scope.NewCustomer).then(function (data) {
        	console.log ('got ' + angular.toJson(data));
        	$scope.errorStr  = err[0].message;
        	$scope.NewCustomer.id = data.id;
        });
                   
    }
}
