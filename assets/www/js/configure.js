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

	SFDCData.query("Product__c", "Id, Name, RecordType.Name, Description__c, ThumbImage69Id__c, Type__c, Make__c, Available_Tariffs__c, Operating_system__c, Colour__c, ConfigMetaData__c",  [{field: "Id", equals: $routeParams.id}])
    	.then(function (data) {

            $scope.product = data[0];
            console.log ('config meta : ' + $scope.product.ConfigMetaData__c);
            $scope.productConfigMetaData = angular.fromJson($scope.product.ConfigMetaData__c);
            $scope.getRichDescroption =  function() {
                return $sce.trustAsHtml($scope.product.Description__c);
            };
            $http.get('/proxy/chatter/files/' + $scope.product.ThumbImage69Id__c)
                .success(function (cdata) {
                        $scope.product.configuredprice = 0;
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
/*
    $scope.configJson = {
     Device: [
         {   name: 'Tarrif',
             icon: 'database',
             desc: 'How much memory?',
             required: true,
             values: [
                 {imgsrc: 'http://www.samsung.com/us/system/support/faq/2014/01/28/faq00059084/icon.No_SIM.png', name: 'Handset Only', desc: 'Unlocked handset without SIM', price: 355, recommended: false },
                 {imgsrc: 'http://files.softicons.com/download/application-icons/qetto-icons-2-by-ampeross/png/256x256/sim%20card.png', name: '4G Unlimited', desc: 'Our fasted 4G with 400Gb data + 200 text, 18 monthly price', price: 55, recommended: true },
                 {imgsrc: 'http://files.softicons.com/download/application-icons/qetto-icons-2-by-ampeross/png/256x256/sim%20card.png', name: '300 Unlimited', desc: '3G with 300Gb data + 100 text, 18 monthly price', price: 35},
                 {imgsrc: 'http://files.softicons.com/download/application-icons/qetto-icons-2-by-ampeross/png/256x256/sim%20card.png', name: '500 Unlimited', desc: '3G with 500Gb data + 200 text, 18 monthly price', price: 45}
             ]
         },
         {   name: 'Memory',
            icon: 'sound',
            desc: 'How much memory?',
            required: true,
            values: [
                { imgsrc: 'http://www.hantsfire.gov.uk/computer-chip-2.jpg', name: '32Mb', desc: 'Good for lots of photos, and some videos', recommended: true, price: 35 },
                { imgsrc: 'http://www.hantsfire.gov.uk/computer-chip-2.jpg', name: '64Mb', desc: 'top selection for videos and many pictures', recommended: true, price: 65  }
            ]
        },
        {   name: 'Specials',
            icon: 'info',
            desc: 'Something for the weekend dir?',
            required: false,
            values: [
                {imgsrc: 'http://image.dhgate.com/albu_279642736_00-1.0x0/100pcs-lot-candy-color-mobile-case-for-iphone5.jpg', name: 'candy color mobile case', price: 9.99 },
                {imgsrc: 'http://www.chinahcs.com/images/Techo4IncredibleRechargeableWirele408005.jpg', name: 'Bluetooth Headset', price: 19.99},
                {imgsrc: 'http://enlightenopex.wpengine.netdna-cdn.com/wp-content/uploads/2013/03/insurance-pc-life-icon-tmb-175x175.png', name: 'Insurance', price: 9.99}
            ]
        }
    ],
    Subscription: [
        {   name: 'Team',
            icon: 'torsos',
            desc: 'How much memory?',
            required: true,
            values: [
                { imgsrc: 'https://cdn3.iconfinder.com/data/icons/people-professions/512/Individual-128.png', name: 'Individual', desc: 'No group facilities, no sharing etc', recommended: false, price: 35 },
                { imgsrc: 'https://cdn2.iconfinder.com/data/icons/picol-vector/32/group_full-128.png', name: 'Team of 5', desc: 'features for groups of upto 5 people', recommended: true, price: 65  },
                { imgsrc: 'http://badg.us/media/uploads/badge/image_team-leader_1341321395_0944.png', name: 'Team of 10', desc: 'unlimited edition', recommended: false, price: 95  }
            ]
        },
        {   name: 'Edition',
            icon: 'social-windows',
            desc: 'How much memory?',
            required: true,
            values: [
            {imgsrc: 'http://icons.iconarchive.com/icons/aha-soft/agriculture/256/cattle-icon.png', name: 'Standard', desc: 'Straw on the floor, no toilettes', price: 55, recommended: true },
            {imgsrc: 'http://png-3.findicons.com/files/icons/2576/computer_icon_pack_1/256/computer_silver.png', name: 'Silver', desc: 'Same as standard with a different icon', price: 95},
            {imgsrc: 'http://www.postadvertising.com/wp-content/uploads/2013/07/twitter-gold-cooky.png', name: 'Gold', desc: 'Completely unilimited, except for everything has a limit', price: 145}
        ]
        }
    ],
    Accessory: [
        {   name: 'Color',
            icon: 'paint-bucket',
            desc: 'uh?',
            required: true,
            values: [
                { imgsrc: 'http://www.clker.com/cliparts/5/H/A/o/3/7/red-circle-th.png', name: 'Red', desc: 'Looks nice', recommended: false, price: 15 },
                { imgsrc: 'http://home.online.no/~t-o-k/Colour_Gradients/Cyan-Blue_256x256.png', name: 'Blue', desc: 'Common', recommended: true, price: 18  },
                { imgsrc: 'http://sa.aos.ask.com/us/sc/cw/pink-color.jpg', name: 'Pink', desc: 'One for the ladies (thats you Matt)', recommended: false, price: 20  }
            ]
        }
        ]
    };
*/
    
    $scope.enableaddtocart = false;
    $scope.productConfig = { };
    $scope.addselection = function (category, val) {
        $scope.productConfig[category] = val;
        $scope.toggleAccordion(category);
        var notfinished = false;
        $scope.product.configuredprice = 0;
        for (var c in $scope.productConfigMetaData) {
            var copt = $scope.productConfigMetaData[c];
            if (copt.required && !$scope.productConfig[copt.name]) {
                notfinished = true;
            } else {
                for (vopt in copt.values) {
                    if (copt.values[vopt].name === $scope.productConfig[copt.name]) {
                        $scope.product.configuredprice += copt.values[vopt].price;
                    }
                }
            }
        }
        if (!notfinished) $scope.enableaddtocart = true;

    }
    $scope.addtobasket = function() {
        $scope.product.config = $scope.productConfig;
        $rootScope.selected.push ($scope.product);
        jQuery('.firstModal').foundation('reveal', 'open');

    }

}
