# Polybuild
> An all-in-one build tool for Polymer apps

Polybuild combines [vulcanize](http://npmjs.com/package/vulcanize), [crisper](http://npmjs.com/package/crisper), and [polyclean](http://npmjs.com/package/polyclean) into one easy to use solution for optimizing Polymer applications for production.

Polybuild exposes a gulp plugin, and a small command line tool to fit your build environment.

## Command Line Tool

Install:
```
npm install -g polybuild
```

Use:
```
polybuild index.html
```

Output: `index.build.html` and `index.build.js`

The equivalent command line usage is:

```
vulcanize --inline-css --inline-scripts --strip-comments index.html | polyclean | crisper --html index.build.html --js index.build.js
```

## Gulp Plugin

Install:
```
npm install polybuild
```

Use in `gulpfile.js`:
```javascript
var gulp = require('gulp');
var polybuild = require('polybuild');

gulp.task('build', function() {
  return gulp.src('index.html')
  .pipe(polybuild())
  .pipe(gulp.dest('.'))
;
})
```

Output: `index.build.html` and `index.build.js`

The equivalent `gulp` pipeline is found in [index.js](https://github.com/PolymerLabs/polybuild/tree/master/index.js)


## Options

PolyBuild has two options: "maximum crush" and "suffix". First option affects whether the output javascript is minified, or only has whitespace removed, second option needed if you want change default "build" suffix.

If you have a more advanced use case than is provided, please copy the equivalent portions of the command line or gulp internals as a starting point.

Example of options usage on the command line with flags:

```
polybuild index.html --maximum-crush --suffix customsuffix
```
which will output the file `index.customsuffix.html`

You can use options in gulp, like in this example

```javascript
//...
.pipe(polybuild({maximumCrush: true, suffix: 'build'})
//...
```
