/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// jshint node: true

'use strict';
var dom5 = require('dom5');
var escodegen = require('escodegen');
var espree = require('espree');
var through2 = require('through2');
var uglify = require('uglify-js');
var PluginError = require('plugin-error');

/**
 * Transforms all inline scripts in `html` with `filter`.
 */
function filterInlineScript(html, filter) {
  var p = dom5.predicates;
  var parsedHtml = dom5.parse(html);
  var isInlineScript = p.AND(
    p.hasTagName('script'),
    p.NOT(p.hasAttr('src'))
  );
  dom5.queryAll(parsedHtml, isInlineScript)
    .forEach(function(inlineScript) {
      var text = dom5.getTextContent(inlineScript);
      dom5.setTextContent(inlineScript, filter(text));
    });
  return dom5.serialize(parsedHtml);
}

/**
 * Transforms all inline styles in `html` with `filter`
 */
function filterInlineStyles(html, filter) {
  var p = dom5.predicates;
  var parsedHtml = dom5.parse(html);
  var isInlineStyle = p.hasTagName('style');
  dom5.queryAll(parsedHtml, isInlineStyle)
    .forEach(function(inlineStyle) {
      var text = dom5.getTextContent(inlineStyle);
      dom5.setTextContent(inlineStyle, filter(text));
    });
  return dom5.serialize(parsedHtml);
}

var ESPREE_OPTIONS = {
  attachComment: false,
  comments: false
};

var LEFT_ALIGN_OPTIONS = {
  format: {
    indent: {
      style: ''
    }
  }
};

function parse(text) {
  return espree.parse(text, ESPREE_OPTIONS);
}

function codegen(ast, options) {
  return escodegen.generate(ast, options);
}

var exports = {
  /**
   * Gulp plugin that removes comments with a parser roundtrip.
   */
  cleanJsComments: function cleanJsComments() {
    return through2.obj(function(file, encoding, cb) {
      try {
        var cleaned = filterInlineScript(String(file.contents), function(text) {
          return codegen(parse(text));
        });
        file.contents = new Buffer(cleaned);
        cb(null, file);
      } catch (e) {
        var err = new PluginError('polyclean', e);
        cb(err);
      }
    });
  },

  /**
   * Left align all the javascript
   * Leave newlines, as they can be useful for debugging
   */
  leftAlignJs: function leftAlignJs() {
    return through2.obj(function(file, encoding, cb) {
      try {
        var cleaned = filterInlineScript(String(file.contents), function(text) {
          return codegen(parse(text), LEFT_ALIGN_OPTIONS);
        });
        file.contents = new Buffer(cleaned);
        cb(null, file);
      } catch (e) {
        var err = new PluginError('polyclean', e);
        cb(err);
      }
    });
  },

  /**
   * Uglify the stream.
   */
  uglifyJs: function uglifyJs(options) {
    options = options || {};
    options.fromString = true;

    return through2.obj(function(file, encoding, cb) {
      try {
        var cleaned = filterInlineScript(String(file.contents), function(text) {
          return uglify.minify(text, options).code;
        });
        file.contents = new Buffer(cleaned);
        cb(null, file);
      } catch (e) {
        var err = new PluginError('polyclean', e);
        cb(err);
      }
    });
  },

  /**
   * Remove CSS Whitespace from text
   */
  stripCss: function stripCss(text) {
    return text.replace(/[\r\n]/g, '')
      // reduce 2 or more spaces to one
      // and remove all leading and trailing spaces
      .replace(/ {2,}/g, ' ')
      .replace(/(^|[;,\:\{\}]) /g, '$1')
      .replace(/ ($|[;,\{\}])/g, '$1');
  },

  /**
   * Remove CSS Whitespace
   */
  cleanCss: function cleanCss() {
    return through2.obj(function(file, enc, cb) {
      try {
        var cleaned = filterInlineStyles(String(file.contents), exports.stripCss);
        file.contents = new Buffer(cleaned);
        cb(null, file);
      } catch (e) {
        var err = new PluginError('polyclean', e);
        cb(err);
      }
    });
  }
};

module.exports = exports;
