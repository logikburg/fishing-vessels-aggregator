var request = require('request');
var htmlparser = require("htmlparser2");
var DomUtils = require("domutils");

// Set the headers
var headers = {
    'User-Agent': 'Super Agent/0.0.1',
    'Content-Type': 'application/x-www-form-urlencoded'
}

// Configure the request
var options = {
    url: 'http://www.wcpfc.int/record-fishing-vessel-database',
    method: 'GET',
    headers: headers
}

var fields = [];

var handler = new htmlparser.DomHandler(function (error, dom) {
    if (error) {} else {
        var tbl = DomUtils.getElementsByTagName('table', dom)
        var ths = DomUtils.getElementsByTagName('th', tbl)
        for (var i in ths) {
            var childTh = DomUtils.getChildren(ths[i]);
            var anch = DomUtils.getElementsByTagName('a', childTh);
            var field = (anch[0].children[0].data).replace(" ", "_").toLowerCase();
            fields[i] = field;
        }
    }
});

var parser = new htmlparser.Parser(handler);

// Start the request
request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        parser.write(body);
        parser.end();
    }
})
