'use strict';
	/*
     * POST https://login.salesforce.com/services/oauth2/token
     * DATA: grant_type=password&client_id=3MVG99qusVZJwhskfsiYZz9vAn3iWjp4V79_irNpsQl9yNiuTCogBf9YkZH_OK9JmP_hdODiXWhX6RqC.RaH4&client_secret=
     2294924384309051352&username=khowling%40telco.dev&password=password123
    *
    */
    angular.module('myApp', ['ngResource', 'ngRoute', 'ngAnimate', 'ngCookies', 'sfdata'])
    	.config(['$routeProvider', function($routeProvider){
        $routeProvider.
                when('/', {
                    templateUrl: static_resource_url+ '/partials/home.html',
             //       resolve: ensureSFDCDataServiceInitialised,
                    controller: function ($scope, SFDCData) {
                    	
                    }
                }).
                when('/search', {
                    templateUrl: static_resource_url+ '/partials/productsearch.html',
                    controller: 'searchCtrl'
                }).
                when('/configure/:id', {
                    templateUrl: static_resource_url+ '/partials/configure.html',
                    controller: 'configureCtrl'
                }).
                when('/packages', {
                    templateUrl: static_resource_url+ '/partials/packages.html'
                }).
                when('/basket', {
                    templateUrl: static_resource_url+ '/partials/basket.html'
                }).
                when('/guided', {
                    templateUrl: static_resource_url+ '/partials/guided.html',
                    controller: 'searchCtrl'
                }).
                when('/customer', {
                    templateUrl: static_resource_url+ '/partials/customer.html',
                    controller: 'custCntl'
                }).
                otherwise({
                    redirectTo: '/'
                });
    }]).filter('split', function() {
        return function(input, delimiter) {
            var delimiter = delimiter || ',';

            return input.split(delimiter);
        }
    }).filter('sfnametolabel', function() {
        return function(input) {
            try {
                return input.replace ('__c', '').replace(/_/g, ' ');
            } catch (e) {
                return 'NO VALUE*';
            }
        }
    }).run(['SFDCData', '$rootScope', '$location', '$http', '$cookies', '$cookieStore', '$route', function(SFDCData, $rootScope, $location, $http, $cookies, $cookieStore, $route) {

    	$rootScope.static_resource_url = static_resource_url;
    	
    	// setup sync metrics
    	SFDCData.initSyncinfo ();

    	// setup basket
    	$rootScope.resetBasket = function () {
    		console.log ('resetBasket');
    		$rootScope.selectedCustomer = null; 
    		$rootScope.selectedBasket = {total: 0.00, items: 0, product: [], payload: []};
	    	return true;
    	}
    	$rootScope.addBasket = function (product, productConfigPrice, productConfig) {
	    	$rootScope.selectedBasket.total += productConfigPrice;
	    	$rootScope.selectedBasket.items ++;
	    	$rootScope.selectedBasket.product.push({product:  product, config: productConfig, price: productConfigPrice})
	    	$rootScope.selectedBasket.payload.push({product:  product.Id, config: productConfig, price: productConfigPrice});
	    }
	    $rootScope.resetBasket();
	    
	    $rootScope.insertSFDC = function() {
	    	console.log ('insertSFDC ');
	    	  $rootScope.saveErrorStr = null;
	        SFDCData.insert("Order__c", {"Contact__c": {"_soupEntryId": $rootScope.selectedCustomer._soupEntryId, "Id": $rootScope.selectedCustomer.Id } ,"OrderMetaData__c": angular.toJson($rootScope.selectedBasket.payload)})
	        	.then(function (res) {
		        	console.log ('got ' + angular.toJson(res));
		        	if (res.id) {
		        		jQuery('#orderconf_modal').foundation('reveal', 'open');
		        		$rootScope.resetBasket();
		        	} else if (res._soupEntryId) {
		        		jQuery('#orderconf_modal').foundation('reveal', 'open');
		        		$rootScope.resetBasket();
		        	} else  { // array
		        		$rootScope.saveErrorStr = 'Didnt Save';
		        		if (res.message) {
		        			$rootScope.saveErrorStr  += ': ' + res.message;
		        		}
		        	}
	         });
	    }
	    
    		
    	$rootScope.$on("$routeChangeSuccess", function(currentRoute, previousRoute){
    		    $rootScope.sidecart = true;
    		    var currTemplate = $route.current.loadedTemplateUrl;
    		    console.log ('check route : ' + currTemplate);
    		    if (currTemplate && currTemplate.indexOf("partials/basket.html")  > -1) {
    		    	console.log ('check route, its a full basket url, dont show the side basket');
    		    	$rootScope.sidecart = false;
    		    }
    	});
    		
			console.log ('running in website, so DONT wait for cordova ready? param : ' + document.URL.split('web=')[1] );
	    if (document.URL.split('web=')[1] == "1") {
	    	SFDCData.resolveCordova(null);
	    }
	    
	   
    }]);

    
    var homeCtrl = function ($rootScope, $scope, SFDCData) {
		    var cordova_change = false,
		    		user_change = false;
		    
		    $scope.inVisualforce = inVisualforce;
		    
		    $scope.$watch('homeonline', function(val) {
		    	console.log ('homeCtrl homeonline change, cordova_change? ' + cordova_change);
		    	if (cordova_change) cordova_change = false;
		    	else {
		    		user_change = true;
		    		console.log ('homeCtrl online change BY THE USER to: ' + val);
		    		SFDCData.setOnline(val);
		    		$scope.mode = val && 'online' || 'offline';
		    	}
		    });
		
		    
		    //$rootScope.online = SFDCData.getOnline();
		    $rootScope.$watch('online', function(val) {
		    	
		    	console.log ('homeCtrl online change, user_change? ' + user_change);
		    	if (user_change) user_change = false; 
		    	else {
		    		cordova_change = true;
		    		console.log ('homeCtrl online change BY CORDOVA to: ' + val);
			    	$scope.homeonline = $rootScope.online;
			    	$scope.mode = val && 'online' || 'offline';
		    	}
		    });
	    }
	    /*
       if ($cookies.sfcontext) {
           // we are in the canvas context!
           console.log ($cookies.sfcontext);
           $rootScope.sf = angular.fromJson ($cookies.sfcontext);
           $cookieStore.remove("sfcontext");
       }

        
        try {

            $http.get('/sfsession').then (function (res) {
                $rootScope.access_token = res.data.access_token ;
                $rootScope.instanceUrl = res.data.instance_url;
            })

        //    var sr = JSON.parse('{{{signedreq}}}');
            // set instanceUrl for links to salesforce objects
        //    $rootScope.instanceUrl = sr.client.instanceUrl;
        //    $rootScope.access_token = sr.client.oauthToken;
        //    $rootScope.targetOrigin = sr.client.targetOrigin;

            // lookup the client the order is for
            var clientid = sr.context.environment.parameters.id;
            var client_url = sr.context.links.sobjectUrl + 'Contact/' + clientid + '/';
            Sfdc.canvas.client.ajax(
                    client_url,
                    {client : sr.client,
                        success : function(data){
                            // Make sure the status code is OK.
                            $rootScope.$apply(function(){
                                console.log ("response  "   + data.payload.Name);
                                $rootScope.contact = data.payload;
                            });
                        }});
        } catch (e) {
            console.log ('no Signed Request');
            $rootScope.instanceUrl = "https://eu2.salesforce.com";
        }
*/