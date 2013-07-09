#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};


var checkHtmlBuffer = function(htmlbuffer, checksfile) {
    $ = cheerio.load(htmlbuffer);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var bufferCheck2Console = function(htmlbuffer, checksfile) {
    var checkJson = checkHtmlBuffer(htmlbuffer, checksfile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var urlCheck2Console = function(url, checksfile) {
    var response2console = function(result, response) {
	if (result instanceof Error) {
	    console.error('Error: ' + util.format(response.message));
	} else {
	    bufferCheck2Console(result, checksfile);
	}
    };
    rest.get(url).on('complete', response2console);
};

var fileCheck2Console = function(filename, checksfile) {
    var htmlbuffer = fs.readFileSync(filename);
    bufferCheck2Console(htmlbuffer, checksfile);
};

if(require.main == module) {
    program
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Url to html file')
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.parse(process.argv);
    if ((program.file || program.url) && program.checks) {
	if (program.file) {
	    fileCheck2Console(program.file, program.checks);
	} else {
	    urlCheck2Console(program.url, program.checks);
	}
    } else {
	console.log("One or more arguments are lacking.");
	process.exit(1);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
