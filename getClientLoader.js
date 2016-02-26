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
                        (new Function(thisNode.innerText))();
                    }
                }
                if (thisNode.children.length > 0){
                    replaceScripts(thisNode);
                }
            }
        };

        var _Loader = function(options){
            this.exchange_hostname = '%s';
            this.exchange_secure_hostname = '%s';
            this.pub_path = '%s';
            this.pid = options.pid;
            this.secure = options.secure;
            var u = (this.secure ? 'https://' + this.exchange_secure_hostname : 'http://' + this.exchange_hostname);
            u += this.pub_path;
            u += '?' + 'pid=' + this.pid + '&type=javascript';
            this.url = encodeURI(u);
        };

        _Loader.prototype.main = function (){
            var self = this;
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    var el = document.getElementById('cloader-' + self.pid);
                    el.innerHTML = xmlHttp.responseText;
                    replaceScripts(el);
                }
            };
            xmlHttp.open("GET", self.url, true); // true for asynchronous
            xmlHttp.send(null);
        };

        return {
            init: function (options) {
                return new _Loader(options);
            }
        };
    };

    var fString = util.format(f.toString(),exchangeHostname, exchangeSecureHostname, pubPath);
    fString = 'var CLoader = CLoader || (' + fString + '());';
    return fString;
};