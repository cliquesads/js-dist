var util = require('util');
var pjson = require('./package.json');
var main = require('./lib/main');
var serialization = require('./lib/serialization');

/**
 * Does the bulk of the work building the CLoader dist files for a given environment.
 * Binds config variables to main loader + any factories and wraps in a self-invoking
 * closure to write to file.
 *
 * @param exchangeHostname
 * @param exchangeSecureHostname
 * @param pubPath
 * @param factory
 * @returns {*}
 */
module.exports = function(exchangeHostname, exchangeSecureHostname, pubPath, factory){
    // first, format main CLoader code w/ URL variables
    let fString = util.format(main.toString(),exchangeHostname, exchangeSecureHostname, pubPath);

    // indent factory, if provided, to match indentation where it will be inserted into CLoader
    if (factory){
        factory = serialization.indent(factory, 8);
        // This is terrible, but it works. Literally inserting factory functions as object keys/values
        // after `init` function
        fString = fString.replace(/([\s\S]*)(\n\s\s\s\s};\n})$/g, '$1,\n'+ factory + '$2');
    }

    fString = 'var CLoader = CLoader || (' + fString + '());';

    const version = pjson.version;
    const now = new Date();
    fString = `/*@preserve Cliques Ad Loader v${version}, built ${now} */ \n` + fString;
    return fString;
};