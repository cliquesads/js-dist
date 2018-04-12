var util = require('util');
var main = require('./lib/main');
var serialization = require('./lib/serialization');

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
 * @param factory
 * @returns {*}
 */
module.exports = function(exchangeHostname, exchangeSecureHostname, pubPath, factory){
    var fString = util.format(main.toString(),exchangeHostname, exchangeSecureHostname, pubPath);
    factory = serialization.indent(factory, 12);
    fString = fString.replace(/([\s\S]*)(\n\s\s\s\s\s\s\s\s};\n\s\s\s\s};\n})$/g, '$1,\n'+ factory + '$2');
    fString = 'var CLoader = CLoader || (' + fString + '());';
    return fString;
};