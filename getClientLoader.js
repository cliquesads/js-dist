var util = require('util');

/**
 * Main function houses contents of CLoader closure and serializes whole function,
 * binding various config params in the process.
 *
 * Object itself resides under var f
 *
 *
 * @param exchangeHostname
 * @param exchangeSecureHostname
 * @param pubPath
 * @returns {*}
 */
module.exports = function(exchangeHostname, exchangeSecureHostname, pubPath){
    var f = function(){
        var _args = {
            exchange_hostname: '%s',
            exchange_secure_hostname: '%s',
            pub_path: '%s'
        };

        return {
            init: function (options) {
                _args.pid = options.pid;
                _args.secure = options.secure;
                var u = (_args.secure ? 'https://' + _args.exchange_secure_hostname : 'http://' + _args.exchange_hostname);
                u += _args.pub_path;
                u += '?' + 'pid=' + _args.pid;
                _args.url = encodeURI(u);
            },
            main: function (){
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function() {
                    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) document.write(xmlHttp.responseText);
                };
                xmlHttp.open("GET", _args.url, true); // true for asynchronous
                xmlHttp.send(null);
            }
        };
    };

    var fString = util.format(f.toString(),exchangeHostname, exchangeSecureHostname, pubPath);
    fString = 'var CLoader = CLoader || (' + fString + '());';
    return fString;
};