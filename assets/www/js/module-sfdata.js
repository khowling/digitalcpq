// used to inject a constant value
//     	{"path":"Description__c","type":"string"}, {"path":"ThumbImage69Id__c","type":"string"}, {"path":"Type__c","type":"string"}, {"path":"Make__c","type":"string"}, {"path":"Available_Tariffs__c","type":"string"}, {"path":"Operating_system__c","type":"string"}, {"path":"Colour__c","type":"string"} 

    	
angular.module('sfdata.constants', []).constant ('soups', {
    "Contact": { 
    	primaryField: 'LastName',
    	allFields: ["Id", "FirstName", "LastName", "Email", "Company__c", "MobilePhone", "MailingPostalCode"],
    	indexSpec:[{"path":"Id","type":"string"},{"path":"LastName","type":"string"},{"path":"Company__c","type":"string"}]},
	"Product__c": {
		primaryField: 'Name',
    	indexSpec:[{"path":"Id","type":"string"},{"path":"Name","type":"string"},
    	           {"path":"Description__c","type":"string"}, {"path":"ThumbImage69Id__c","type":"string"}, {"path":"Type__c","type":"string"}, {"path":"Make__c","type":"string"}, {"path":"Available_Tariffs__c","type":"string"}, {"path":"Operating_system__c","type":"string"}, {"path":"Colour__c","type":"string"} 
    	           ]},
    "Order__c": {
    	primaryField: 'Name',
    	indexSpec:[{"path":"Id","type":"string"},{"path":"Name","type":"string"}],
    	allFields: ["Id", "Contact__c","OrderMetaData__c"],
    	childLookupFields: { "Contact__c": "Contact"}
    	}
});

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
            for (var sname in soups) {
                var idxes = soups[sname].indexSpec;

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
        	return _queryMode (obj, fields , where, _online)
        }
        
        var _queryMode = function(obj, fields , where, mode) {
        	if (!_creds) {
        		console.log ('we dont have the credentials from the cordova container, so use hardwired!');
        		sess = _sfdccreds.session_api;
        		pth = _sfdccreds.sf_host_url + _sfdccreds.sfdc_api_version;
        	} else {
        		sess = _creds.accessToken;
        		pth = _creds.instanceUrl + _sfdccreds.sfdc_api_version;
        	}
        	
        	var buildsql = function(obj, fields, smart) {
        	
        		var formatfld = function (obj, field, smart) {
        			if (!smart)
        				return field;
        			else 
        				return "{" + obj + ":" + field + "}";
        		}
        		
        		var qstr = "SELECT ";
        		for (var fidx in fields) {
        			if (fidx >0) qstr += ", ";
        			qstr += formatfld (obj, fields[fidx], smart)
        		}
        		
        		if (!smart)
        			qstr += " FROM " + obj;
        		else 
        			qstr += " FROM {" + obj + "}";
        		
        		if (where) {
        			for (var whereidx in where) {
        				if (whereidx == 0) { 
        					qstr += " WHERE ";
        				} else {
        					qstr += " AND ";
        				}
        				var whereitem = where[whereidx];
        				qstr += formatfld (obj, whereitem.field, smart)
        				if (whereitem.like)
        					if (!smart)
        						qstr += " LIKE '" + whereitem.like + "%25'";
        					else
        						qstr += " LIKE '" + whereitem.like + "%'";
        				else if (whereitem.contains)
        					if (!smart)
        						qstr += " LIKE '%25" + whereitem.contains + "%25'";
        					else
        						qstr += " LIKE '%" + whereitem.contains + "%'";
        				else if (whereitem.equals)
        					qstr += " = '" + whereitem.equals + "'";
        			}
        		}
        		
        		qstr += " ORDER BY " + formatfld (obj, soups[obj].primaryField, smart);
        		return qstr;
        	}
        	
        	if (mode) {
        		var qstr = buildsql (obj, fields, false);
        		console.log ('online running query : ' + qstr);
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
        		var ssDeffer = $q.defer();
        		console.log ('offline running query');
        		if (_smartstore) {
        			
        			var qspec;
        			var smartqsl;
        			
        			if (!where || where.length == 0) {
        				console.log ('offline search running buildAllQuerySpec');
        				qspec = _smartstore.buildAllQuerySpec (soups[obj].primaryField, null, 100);
        			}
        			else if (where.length == 1 && where[0].equals) {
        				console.log ('offline search running buildExactQuerySpec : ' + where[0].field + ' = ' + where[0].equals);
        				qspec = _smartstore.buildExactQuerySpec (where[0].field, where[0].equals, null, 100);
        			} 
        			else if (where.length == 1 && where[0].like) {
        				console.log ('offline search running buildLikeQuerySpec : ' + where[0].field + ' = ' + where[0].equals);
        				qspec = _smartstore.buildLikeQuerySpec (where[0].field, where[0].like + "%", null, 100);
        			} 
        			else {
        				// SmartQuery requires Everyfield to be indexed & ugly post processing ! the others do not!
        				smartqsl = buildsql (obj, fields, true);
        				console.log ('offline search running smartqsl : ' + smartqsl);
        				qspec = _smartstore.buildSmartQuerySpec(smartqsl, 100);
        			}
        			
        			var success = function (val) {
                    	console.log ('querySoup got data ' + angular.toJson(val));
                    	if (smartqsl) { // using smartSQL, need to do some reconstruction UGH!!!
                    		var results = [];
                    		for (var rrecidx in val.currentPageOrderedEntries) {
                    			var res = {},
                    				rrec = val.currentPageOrderedEntries[rrecidx];
                    			for (var fidx in fields) {
                    				res[fields[fidx]] = rrec[fidx];
                    			}
                    			results.push (res);
                    		}
                    		ssDeffer.resolve(results);
                    	} else {
                    		ssDeffer.resolve(val.currentPageOrderedEntries);  
                    	}
                    }
                    var error = function (val) { 
                    	console.log  ('querySoup error ' + angular.toJson(val));
                    	ssDeffer.reject(val);  
                    }
                    if (smartqsl) {
                    	_smartstore.runSmartQuery(qspec, success,error);
                    } else {
                    	_smartstore.querySoup(obj, qspec, success,error);
                    }
        		} else {
        			console.log ('Device offline & no smartstore');
        			ssDeffer.reject('Device offline & no smartstore'); 
        		}
        		return ssDeffer.promise;
        	}
        }	
        
        // ----------------------- insert function
        var _insert = function(obj, objdata, dependentSoupToId) {
        	if (!_creds) {
        		console.log ('we dont have the credentials from the cordova container, so use hardwired!');
        		sess = _sfdccreds.session_api;
        		pth = _sfdccreds.sf_host_url + _sfdccreds.sfdc_api_version;
        	} else {
        		sess = _creds.accessToken;
        		pth = _creds.instanceUrl + _sfdccreds.sfdc_api_version;
        	}
        	
        	var offlineUpsert = function (ol_obj, ol_objdata) {
        		console.log ('offline upsert');
        		var ssDeffer = $q.defer();
        		
        		if (_smartstore) {
        			var success = function (val) {
                    	console.log ('upsertSoupEntries got data ' + angular.toJson(val));
                    	ssDeffer.resolve(val[0]);  
                    }
                    var error = function (val) { 
                    	console.log  ('upsertSoupEntries error ' + angular.toJson(val));
                    	ssDeffer.resolve(val);  
                    }
                    _smartstore.upsertSoupEntries (ol_obj, [ol_objdata], success, error)
        		} else {
        			ssDeffer.reject('Device offline & no smartstore'); 
        		}
        		return ssDeffer.promise;
        	}
        	
        	if (_online) {
        		console.log ('online upsert');
        		var olDeffer = $q.defer();
        		
        		var clean_objdata = {},
        			allFields = soups[obj].allFields,
        			childLookupFields = soups[obj].childLookupFields || {};
        			
    			for (var fidx in allFields) {
    				var f = allFields[fidx];
    				if (f == 'Id' && objdata[f] == 'LOCAL') {
    					console.log ('Its a Id field of value LOCAL, its a new insert, so dont add to clean object data');
    				} else if (childLookupFields[f]) {
    					console.log ('Its a Lookup field, check we have the lookup sfdc Id');
						if (objdata[f]._soupEntryId) {
	    					console.log ('I have lookup field with a _soupId ref, need to find the Id,  : ' + f + ', lookup to soup : ' + lookup_soup + '  : ' + objdata[f]._soupEntryId);
	    					if (dependentSoupToId[obj] && dependentSoupToId[obj][objdata[f]._soupEntryId]) {
	    						objdata[f] = dependentSoupToId[obj][objdata[f]._soupEntryId];
	    						clean_objdata[f] = objdata[f];
	    						console.log ('got it! : ' + objdata[f]);
	    					} else {
	    						console.log ('Fail, dont have a entry in the dependentSoupToId map :(');
	    					}
						} else if (objdata[f].Id) {
    						console.log ('we already have a sfdc Id for the parent : ' + objdata[f].Id);
    						objdata[f] = objdata[f].Id;
    						clean_objdata[f] = objdata[f];
    					}
    				} else {
    					clean_objdata[f] = objdata[f];
    				}
    			}
        		
        		$http.post(pth  + "/sobjects/" + obj + "/", clean_objdata, {
	                    headers: {  'Authorization': 'OAuth ' + sess  }
	                }).success (function (results) {
	                	console.log ('online success resolve : ' + angular.toJson(results));
	                	objdata.Id = results.Id
	                	if (_smartstore) {
	                		offlineUpsert (obj, objdata).then (function(offresults) {
	                			olDeffer.resolve(offresults); 
	                		});
	                	} else {
	                		olDeffer.resolve(results); 
	                	}
	               }).error (function (results) {
	                	console.log ('error resolve : ' + angular.toJson(results));
	                	olDeffer.resolve(results[0]); 
	                });
        		return olDeffer.promise;
        	} else {
        		objdata.Id = 'LOCAL';
        		$rootScope.tosync +=  1;
        		return offlineUpsert (obj, objdata);
        	}
        }

        // The  singleton service injected into components dependent on the service
        return {
        	isInitialised: function() { return _resolved; },
	    	cordovaDeffer: cordovaDeffer,
	    	resolveCordova: resolveCordova,
	    	setOnline: function(val) { 
	    		_online = val; 
	    		// sync any new/updated customers/orders
	    		if (val) {
	    			var soupToId = {};
	    			
	    			var obj = "Contact",
	    				allFields = soups[obj].allFields;
	    			
	    			soupToId[obj] = {};
	    			
	    			_queryMode(obj, allFields,  [{field: 'Id', equals: 'LOCAL'}], false )
			    		.then(function (data) {
			    			$rootScope.tosync = data.length;
			    			$rootScope.syncerrors = [];
				    		console.log ('sync Contact : ' + angular.toJson(data));
				    		for (var d in data) {

	                			console.log ('upserting into ' + obj + ' : ' + angular.toJson(data[d]));
				    			_insert(obj, data[d]).then (function (res) {
			    					if (res.Id && res.Id !== 'LOCAL') {
			    						console.log ('Save soupToId, incase any child records have been created that references this parent: ' + soupToId[obj][data[d]._soupEntryId] + ' > ' + res.Id);
			    						soupToId[obj][data[d]._soupEntryId] = res.Id;
			    						$rootScope.tosync +=  -1;
			    		        	} else { // array
			    		        		var serr = 'Sync Error for ['+res._soupEntryId+']';
			    		        		if (res.message) {
			    		        			serr  += ': ' + res.message;
			    		        		}
			    		        		$rootScope.syncerrors.push (serr)
			    		        	}
				    			})
				    		}
				    	})
	    		}
	    	},
	    	getOnline: function() { 
	    		return _online; 
	    	},
	        getCreds: function() { 
	        	return _creds; 
	        },
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