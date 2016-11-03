var fs = require('fs');
var path = require('canonical-path');
var _ = require('lodash');



// Custom reporter
var htmlReporter = function(options) {
 

  var _defaultOutputFile = path.resolve(process.cwd(), './_test-output', 'protractor-results.html');
  options.outputFile = options.outputFile || _defaultOutputFile;


  initOutputFile(options.outputFile);
  options.appDir = options.appDir || './';
  var _root = {
    appDir: options.appDir,
    suites: []
  };
  log('AppDir: ' + options.appDir, +1);
  var _currentSuite;

  this.suiteStarted = function(suite) {
    _currentSuite = {
      description: suite.description,
      status: null,
      specs: []
    };
    _root.suites.push(_currentSuite);
    log('Suite: ' + suite.description, +1);
  };

  this.suiteDone = function(suite) {
    var statuses = _currentSuite.specs.map(function(spec) {
      return spec.status;
    });
    statuses = _.uniq(statuses);
    var status = statuses.indexOf('failed') >= 0 ? 'failed' : statuses.join(', ');
    _currentSuite.status = status;
    log('Suite ' + _currentSuite.status + ': ' + suite.description, -1);
  };

  this.specStarted = function(spec) {

  };

  this.specDone = function(spec) {
    var currentSpec = {
      description: spec.description,
      status: spec.status,
      screenshot: spec.screenshot
    };
    if (spec.failedExpectations.length > 0) {
      currentSpec.failedExpectations = spec.failedExpectations;
    }
    currentSpec.screenshot = currentSpec.description.replace(/ /g, '-') + '.png';

    browser.takeScreenshot().then(function(base64png) {


      var screenshotFolder = '_test-output/screenshots';
     var screenshotPath = path.resolve(process.cwd(), screenshotFolder, currentSpec.screenshot);

      ensureDirectoryExistence(screenshotPath);


      writeScreenshot(base64png, screenshotPath);
    });

    _currentSuite.specs.push(currentSpec);
    log(spec.status + ' - ' + spec.description);
  };

  this.jasmineDone = function() {
    outputFile = options.outputFile;
    var output = formatOutput(_root);
    fs.appendFileSync(outputFile, output);
  };

  function writeScreenshot(base64png, filename) {

    var stream = fs.createWriteStream(filename);
    stream.write(new Buffer(base64png, 'base64'));
    stream.end();

  }

  function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (directoryExists(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

  function directoryExists(path) {
    try {
      return fs.statSync(path).isDirectory();
    } catch (err) {
      return false;
    }
  }

  function initOutputFile(outputFile) {
    ensureDirectoryExistence(outputFile);
    var header = "<!DOCTYPE html><html><head lang=en><meta charset=UTF-8><title>" + (new Date()).toLocaleString() + "</title><style>td, th {border: 1px solid #dddddd; text-align: left; padding: 8px;}tr.passed{background-color:green;}tr.failed{background-color:red;}</style></head>";
    fs.writeFileSync(outputFile, header);
  }

  // for output file output
  function formatOutput(output) {
    var html = '<body><div><h2>' + "Protractor results for: " + (new Date()).toLocaleString() + '</h2></div>';
    html += '<div>';
    output.suites.forEach(function(suite) {
      html += '<div class="suite"><h4>' + suite.status.toUpperCase()+ '   '+'Suite: ' + suite.description+'</h4>';
      html += '<table><tr><th>Status</th><th>Status</th><th>Screenshot</th></tr>';
      suite.specs.forEach(function(spec) {

        if (spec.status === "passed") {
          html += '<tr class="passed">';
        } else {
          html += '<tr class="failed">';
        }
        html += '<td>' + spec.status + '</td>' + '<td>' + spec.description + '</td>';
        html += '<td><a href="' + 'screenshots/' + spec.screenshot + '" class="screenshot">';
        html += '<img src="' + 'screenshots/' + spec.screenshot + '" width="100" height="100" />';
        html += '</a></td></tr>';
        if (spec.failedExpectations) {
          spec.failedExpectations.forEach(function(fe) {
            html += '<div class="error">' + 'message: ' + fe.message;
          });
        }

      });

    });
    html += '</table></div>';
    html += '</html>';
    return html;
  }

  // for console output
  var _pad;

  function log(str, indent) {
    _pad = _pad || '';
    if (indent == -1) {
      _pad = _pad.substr(2);
    }
    console.log(_pad + str);
    if (indent == 1) {
      _pad = _pad + '  ';
    }
  }
};

module.exports = htmlReporter;