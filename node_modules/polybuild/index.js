/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

//jshint node: true
'use strict';

var crisper = require('gulp-crisper');
var lazypipe = require('lazypipe');
var polyclean = require('polyclean');
var rename = require('gulp-rename');
var vulcanize = require('gulp-vulcanize');
var gutil = require('gulp-util');

var htmlPipe = lazypipe()
  // inline html imports, scripts and css
  // also remove html comments
  .pipe(vulcanize, {
    inlineScripts: true,
    inlineCss: true,
    stripComments: true
  })
  // remove whitespace from inline css
  .pipe(polyclean.cleanCss)
;

// remove javascript whitespace
var leftAlign = polyclean.leftAlignJs;

// minimize javascript with uglifyjs
var uglify = polyclean.uglifyJs;

module.exports = function(opts) {
  opts = opts || {};
  var crush = opts.maximumCrush;
  
  var suffix = '.build'; //true || undefined

  if (opts.suffix === false || opts.suffix === ""){
    suffix = "";
  } else if (typeof opts.suffix === 'string') {
    suffix = '.' + opts.suffix.split('.').join('');
  }
  
  var pipe = htmlPipe
  // switch between cleaning or minimizing javascript
  .pipe(crush ? uglify : leftAlign)
  // rename files with an infix '.build'
  .pipe(rename, function(path) {
    path.basename += suffix;
  })
  // split the javascript out into `.build.js` for CSP compliance
  .pipe(crisper)
  ()
  ;

  // have to handle errors ourselves, thanks gulp >:(
  pipe.on('error', function(error) {
    gutil.log(error.toString());
    process.exit(1);
  });

  return pipe;
};
