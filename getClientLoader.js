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

        var copyAttributes = function(oldNode, newNode){
            for (var i=0; i < oldNode.attributes.length; i++){
                var attr = oldNode.attributes[i];
                newNode.setAttribute(attr.name, attr.value);
            }
        };

        var replaceScripts = function(parent){
            for (var j=0; j < parent.children.length; j++){
                var thisNode = parent.children[j];
                if (thisNode.nodeName === 'SCRIPT'){
                    if (thisNode.attributes.src){
                        var nextSibling = thisNode.nextSibling;
                        parent.removeChild(thisNode);
                        // now create new element
                        var new_s = document.createElement("script");
                        copyAttributes(thisNode, new_s);
                        parent.insertBefore(new_s, nextSibling);
                    } else {
                        // #sorrynotsorry
                        eval(thisNode.innerText);
                    }
                }
                if (thisNode.children.length > 0){
                    replaceScripts(thisNode);
                }
            }
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
                    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                        var el = document.getElementById('cloader-' + _args.pid);
                        el.innerHTML = xmlHttp.responseText;
                        replaceScripts(el);
                    }
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