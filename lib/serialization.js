module.exports = {
    indent: function(string, spaces){
        var f = string.split('\n');
        var f1 = [];
        f.forEach(function(line){
            if (line !== ''){
                var s = Array(spaces).fill(' ').join('');
                f1.push(s + line);
            }
        });
        return f1.join('\n');
    },
    unindent: function(string, spaces){
        var f = string.split('\n');
        var f1 = [];
        f.forEach(function(line){
            if (line !== ''){
                for (var i=0; i<spaces; i++){
                    if (line.startsWith(' ')){
                        line = line.slice(1);
                    }
                }
                f1.push(line);
            }
        });
        return f1.join('\n');
    },
    serializeObject: function(object){
        var lines = [];
        for (var k in object){
            if (object.hasOwnProperty(k)){
                lines.push(k + ':' + object[k].toString());
            }
        }
        return lines.join(',\n');
    }
};