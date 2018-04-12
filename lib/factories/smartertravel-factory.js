var util = require('util');
var serialization = require('../serialization');

// hack
var _Loader = function(options){};

/**
 * Main function houses contents of factory functions and serializes whole function,
 * binding custom config params in the process.
 *
 * Object itself resides under var f
 *
 * @param customOptions
 * @returns {*}
 */
module.exports = function(customOptions){
    var factories = {
        /**
         * Custom factory function for SmarterTravel that inits a CLoader with search ID external params,
         * either via the SmarterAds SDK for third party sites, or via a call to the SmarterAds
         * search service.
         *
         * @param options
         * @param callback
         * @returns {*|void}
         */
        smarterTravelFactory: function(options, callback){

            // first grab options and add click private tracking sub-obj
            options._clickTracking = {
                // base click URL to hit. Will serialize options.external & append as query params
                trackingUrlBase: '%s',
                // query parameter key to map creative.externalId to
                externalIdKey: '%s'
            };

            // SmarterAds async flag to indicate whether to wrap in event listener
            // or retrieve search ID's from SmarterAds API service
            if (window.smarter && window.smarter.nativeActive){
                return this._sdkFactory(options, callback);
            } else {
                return this._adServiceFactory(options, callback);
            }
        },

        /**
         * Creates new CLoader after promise is resolved containing search ID
         *
         * Promise data is expected in the following format:
         *
         * {
             *   ads: [
             *       {
             *           displayName: 'Travelspike',
             *           id: '12345678',
             *           searchRedirectParams: {
             *               scoring_scheme: 'a1b2c3d4',
             *               as_recipes: 'e5f6g7h8'
             *       },
             *       ...
             *   ],
             *   destinationId: 60745,
             *   searchId: 'a1b2c3d4-e5f6g7h8'
             * }
             *
         * @param options CLoader options object
         * @param callback function(err, cloader)
         * @private
         */
        _sdkFactory: function(options, callback){
            // rename to whatever variable in global scope storing SmarterAds SDK instance is
            options.external = options.external || {};
            // register handler w/ SmarterAds SDK native ads promise that executes callback w/ new CLoader.
            window.smarter('wait', { key: 'nativeAdDataDeferrer', handler: function(data){
                    // pass locationID for targeting purposes
                    options.locationId = data.destinationId;

                    // now set external params, to be passed straight through to
                    // click URL
                    options.external.imp_id = data.searchId;
                    options.external.scoring_location = data.destinationId;
                    options.external.location2 = 'g' + data.destinationId;

                    // try to get scoring scheme from searchRedirectParams from first ad in array.
                    // All ads should have identical scoring schemes.
                    if (data.ads && data.ads.length > 0){
                        options.external.scoring_scheme = data.ads[0].searchRedirectParams.scoring_scheme;
                    }
                    callback(null, new _Loader(options));
                }});
        },

        /**
         * Calls SmarterAds service API to get search ID's before returning
         * a new CLoader instance. adService response expected to be of format:
         *
         * {
             *       "success": {
             *           "searchId": "b0145eb8-4937-47db-9f96-a70a46b58a1a",
             *           "ads": {
             *               "native ads": [
             *                   {
             *                       "id": 20008102,
             *                       "section": "hotel",
             *                       "placement": "native ads",
             *                       "displayName": "TravelSpike_NativeAds_TestAd",
             *                       "currencyCode": "USD",
             *                       "trackingHash": "283ccd1c20",
             *                       "logo": null,
             *                       "tabLogo": null,
             *                       "universalHiresLogo": null,
             *                       "universalLogo": null,
             *                       "fauxTabs": null,
             *                       "url": "",
             *                       "airlineId": null,
             *                       "phone": null,
             *                       "clickUrl": null,
             *                       "subtext": null,
             *                       "isPreCheckedSmarterAd": true,
             *                       "searchRedirectParams": {
             *                           "scoring_scheme": "271a8989-c1af-4174-84f3-04ef4e4c7392",
             *                           "as_recipes": ""
             *                       }
             *                   }
             *               ]
             *           },
             *           "pixels": []
             *       },
             *       "errors": [],
             *       "warnings": [
             *           {
             *               "code": 2,
             *               "message": "numberOfTravelers is missing or invalid",
             *               "messageKey": "{validation.numberOfTravelers}",
             *               "payload": {
             *                   "field": "searchValidation.numberOfTravelers",
             *                   "value": "null"
             *               }
             *           },
             *           {
             *               "code": 2,
             *               "message": "userPersistentId is missing or invalid",
             *               "messageKey": "{validation.userPersistentId.missing}",
             *               "payload": {
             *                   "field": "userPersistentId",
             *                   "value": "null"
             *               }
             *           },
             *       ],
             *       "completedAt": "2018-04-06T17:44:51.525Z"
             *   }
         * @param options CLoader options object
         * @param callback function(err, cloader)
         * @private
         */
        _adServiceFactory: function(options, callback){
            var adserviceParams = {
                key: '%s',
                placement: '%s',
                scheme_id: '%s',
                test: '%s'
            };
            var adserviceBaseUrl = '%s';

            if (options.locationId){
                adserviceParams.destination = options.locationId;
            } else {
                console.warn('No LocationID provided to CLoader factory, must provide a ' +
                    'location ID for Ad Service call to succeed');
            }
            var adserviceUrl = [adserviceBaseUrl, serializeObject(adserviceParams)].join('?');

            var xmlHttp = new XMLHttpRequest();
            options.external = options.external || {};
            xmlHttp.onreadystatechange = function(){
                if (xmlHttp.readyState === 4 && xmlHttp.status === 200){
                    var responseJson = JSON.parse(xmlHttp.responseText);
                    var success = responseJson.success;

                    // now build options.external, which ultimately gets passed to click tracking constructor
                    options.external.imp_id = responseJson.success.searchId;
                    options.external.scoring_location = options.locationId;
                    options.external.location2 = 'g' + options.locationId;

                    // try to get scoring scheme from searchRedirectParams from first ad in array.
                    // All ads should have identical scoring schemes.
                    if (success.ads &&
                        success.ads["native ads"] &&
                        success.ads["native ads"].length > 0){
                        options.external.scoring_scheme = success.ads["native ads"][0]
                            .searchRedirectParams.scoring_scheme;
                    }
                    callback(null, new _Loader(options));
                } else if (xmlHttp.readyState === 4 && xmlHttp.status !== 200){
                    var msg = 'CLoader factory error: Response ' + xmlHttp.status + ' received from ad service.';
                    var err = new Error(msg);
                    console.warn(msg);
                    callback(err, new _Loader(options));
                }
            };
            xmlHttp.open("GET", adserviceUrl , true); // true for asynchronous
            xmlHttp.send(null);
        }
    };

    // turn object into string
    var f = serialization.serializeObject(factories);
    // unindent 8 spaces, or however many spaces object above is indented with
    f = serialization.unindent(f, 8);

    return util.format(f,
        customOptions.trackingUrlBase,
        customOptions.externalIdKey,
        customOptions.adServiceKey,
        customOptions.placement,
        customOptions.scheme_id,
        customOptions.test,
        customOptions.adserviceBaseUrl
    )
};