// used to inject a constant value
angular.module('sfdata.constants', []).constant ('soups', [
    {name: 'Contact', 
    	indexSpec:[{"path":"Id","type":"string"},{"path":"LastName","type":"string"},{"path":"Company__c","type":"string"}]},
	{name: 'Product__c', 
    	indexSpec:[{"path":"Id","type":"string"},{"path":"Name","type":"string"}]}
]);

// Services are registered to modules via the Module API. Typically you use the Module#factory API to register a service
angular.module('sfdata.service', ['sfdata.constants'])

    // component should explicitly define its dependencies dependency injection (DI)
    .factory( 'SFDCData', ['soups', '$document', '$http', '$rootScope', '$q', function(soups, $document,  $http, $rootScope, $q) {
        console.log('SFDCData service initialisation');
        
        // orgId, accessToken, userAgent, userId, identityUrl, communityUrl, refreshToken, clientId, instanceUrl, communityId
        var _creds;
        var _sfdcoauth;
        var _smartstore
        var _online = true;
        
        // ----------------------- registerSoups function
        var registerSoups = function(smartstore) {
            console.log ('registerSoups ' + angular.toJson(soups));
            var registerPromises = [];
            for (s in soups) {
                var sname = soups[s].name;
                var idxes = soups[s].indexSpec;

                var deferred = $q.defer();
                var success = function (val) {
                	console.log ('success registerSoup ' + angular.toJson(val));
                	deferred.resolve(val); 
                }
                var error = function (val) { 
                	console.log ('error registerSoup ' + angular.toJson(val));
                	deferred.reject(val); 
                }

                console.log ('calling registerSoup for ' + sname + ', idx : ' + angular.toJson(idxes));
                smartstore.registerSoup(sname, idxes, success, error);
                //mockStore.registerSoup(sname, idxes, success, error);
                registerPromises.push(deferred);
            }

            return $q.all(registerPromises).then(function () {
            	console.log ('I am Finished registerSoup!');
            });
        };
        
        // ----------------------- setupOauthCreds from cordova plugin
        var setupOauthCreds = function(sfdcoauth) {
        	var deferredOauth = $q.defer();
            var success = function (val) {
            	console.log ('authenticate got creds ' + angular.toJson(val));
            	_creds = val;
            	deferredOauth.resolve(val);  
            }
            var error = function (val) { 
            	console.log  ('authenticate error ' + angular.toJson(val));
            	deferredOauth.reject(val);  
            }
            console.log  ('calling authenticate(success, error) ');
        	sfdcoauth.authenticate (success, error);
        	
        	return deferredOauth.promise;
        }

        var cordovaDeffer = $q.defer(),
            _resolved = false;
        
     // ----------------------- resolveCordova, call once we finished the cordova plugins initialisation, or if we're on the web
        var resolveCordova = function (cordova) {
        	console.log ('resolveCordova : ' + _resolved);
        	if (!_resolved) {
        		_resolved = true;
    			cordovaDeffer.resolve(cordova);
    		}
        }
        // ----------------------- cordovaReady, run when we have the ok device ready from cordova
        var cordovaReady = function (cordova) {
        	
            _sfdcoauth = cordova.require("salesforce/plugin/oauth");
            _smartstore = cordova.require("salesforce/plugin/smartstore");
            _smartstore.setLogLevel();
 
            setupOauthCreds(_sfdcoauth).then (function () {
            	console.log ('calling registerSoups');
            	registerSoups (_smartstore).then ( function () {
            		console.log  ('done, resolve cordova init');
            		resolveCordova (cordova);
            	})
            });
        }
        
        console.log ('add listener for cordova deviceready');
        document.addEventListener('deviceready', function() {
        	console.log ('got cordova deviceready');
        	cordovaReady(window.cordova);	
        });
        /* after 2seconds, Check to make sure we didn't miss the event (just in case)
        setTimeout(function() {  
        	if (!_resolved && window.cordova) { 	
        		cordovaReady(window.cordova);  
        		}}, 2000);
		*/

        // ----------------------- query function
        var _query = function(obj, fields , where) {
        	if (!_creds) {
        		console.log ('we dont have the credentials from the cordova container, so use hardwired!');
        		sess = _sfdccreds.session_api;
        		pth = _sfdccreds.sf_host_url + _sfdccreds.sfdc_api_version;
        	} else {
        		sess = _creds.accessToken;
        		pth = _creds.instanceUrl + _sfdccreds.sfdc_api_version;
        	}
        	
        	if (_online) {
        		var qstr = "SELECT " + fields + " FROM " + obj
        		if (where) {
        			for (var whereidx in where) {
        				if (whereidx == 0) { 
        					qstr += " WHERE ";
        				} else {
        					qstr += " AND ";
        				}
        				var whereitem = where[whereidx];
        				if (whereitem.like)
        					qstr += whereitem.field + " LIKE '" + whereitem.like + "%25'";
        				else if (whereitem.equals)
        					qstr += whereitem.field + " = '" + whereitem.equals + "'";
        			}
        		}
        		console.log ('running query : ' + qstr);
        		return $http.get(pth  + "/query/?q=" + qstr,
	                    {
	                        headers: {  'Authorization': 'OAuth ' + sess  }
	                    }).then (function (results) {
	                    	//console.log ('got ' + angular.toJson(results.data));
	                    	if (_smartstore && results.data.records) {
	                    		//console.log ('save results for offline : ' + obj + ' : ' + angular.toJson(results.data.records));
	                    		_smartstore.upsertSoupEntriesWithExternalId(obj, results.data.records, "Id", function (val) { console.log ('upsert success: ' + angular.toJson(val));}, function (val) { console.log ('upsert error: ' + angular.toJson(val));});
	                    	}
	                    	return results.data.records;
	                    });
        	} else {
        		console.log ('offline search');
        		var ssDeffer = $q.defer();
        		
        		if (_smartstore) {
        			var qspec;
        			if (where && where.like) {
        				qspec = _smartstore.buildLikeQuerySpec (where.field, where.like + "%", null, 100);
        			} else {
        				qspec = _smartstore.buildAllQuerySpec ('LastName', null, 100);
        			}
        			
        			var success = function (val) {
                    	console.log ('querySoup got data ' + angular.toJson(val));
                    	ssDeffer.resolve(val.currentPageOrderedEntries);  
                    }
                    var error = function (val) { 
                    	console.log  ('querySoup error ' + angular.toJson(val));
                    	ssDeffer.reject(val);  
                    }
                    
        			_smartstore.querySoup(obj, qspec, success,error);
        			
        		} else {
        			ssDeffer.reject('Device offline & no smartstore'); 
        		}
        		return ssDeffer.promise;
        	}
        }	
        
        // ----------------------- insert function
        var _insert = function(obj, objdata) {
        	if (!_creds) {
        		console.log ('we dont have the credentials from the cordova container, so use hardwired!');
        		sess = _sfdccreds.session_api;
        		pth = _sfdccreds.sf_host_url + _sfdccreds.sfdc_api_version;
        	} else {
        		sess = _creds.accessToken;
        		pth = _creds.instanceUrl + _sfdccreds.sfdc_api_version;
        	}
        	
        	if (_online) {
        		console.log ('online upsert');
        		var olDeffer = $q.defer();
        		
        		$http.post(pth  + "/sobjects/" + obj + "/", objdata, {
	                    headers: {  'Authorization': 'OAuth ' + sess  }
	                }).success (function (results) {
	                	console.log ('success resolve : ' + angular.toJson(results));
	                	olDeffer.resolve(results); 
	               }).error (function (results) {
	                	console.log ('error resolve : ' + angular.toJson(results));
	                	olDeffer.resolve(results[0]); 
	                });
        		return olDeffer.promise;
        	} else {
        		console.log ('offline upsert');
        		var ssDeffer = $q.defer();
        		
        		if (_smartstore) {
        			var success = function (val) {
                    	console.log ('upsertSoupEntries got data ' + angular.toJson(val));
                    	ssDeffer.resolve(val);  
                    }
                    var error = function (val) { 
                    	console.log  ('upsertSoupEntries error ' + angular.toJson(val));
                    	ssDeffer.resolve(val);  
                    }
        			upsertSoupEntries (obj, [objdata], success, error)
        		} else {
        			ssDeffer.reject('Device offline & no smartstore'); 
        		}
        		return ssDeffer.promise;
        	}
        }

        // The  singleton service injected into components dependent on the service
        return {
        	isInitialised: function() { return _resolved; },
	    	cordovaDeffer: cordovaDeffer,
	    	resolveCordova: resolveCordova,
	    	setOnline: function(val) { _online = val; },
	    	getOnline: function() { return _online; },
	        getCreds: function() { return _creds; },
	        query: _query,
	        insert: _insert
	    }
    }])
    //Use this method to register work which needs to be performed on module loading
    .config(function () { //console.log('sfdata.service config function');
    	})
    // Use this method to register work which should be performed when the injector is done loading all modules
    .run(function(){ //console.log('sfdata.service run function'); 
    	});

// A module is a collection of services, directives, controllers, filters, and configuration information
angular.module('sfdata', ['sfdata.service', 'sfdata.constants']);


var ensureSFDCDataServiceInitialised = {
	    'SFDCData':function(SFDCData){   if (SFDCData.isInitialised()) return true; else return SFDCData.cordovaDeffer.promise;  }};