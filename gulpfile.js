const gulp = require(`gulp`);
const clean = require(`gulp-clean`);
const imagemin = require(`gulp-imagemin`);
const jsonMinify = require(`gulp-json-minify`);
const minifyHTML = require(`gulp-minify-html`);
const minifyCSS = require(`gulp-clean-css`);
const preprocess = require(`gulp-preprocess`);
const sourcemaps = require(`gulp-sourcemaps`);

const minimist = require(`minimist`);

const rollup = require(`rollup`);
const rollupTerser = require(`rollup-plugin-terser`).terser;
const rollupSourcemaps = require(`rollup-plugin-sourcemaps`);

const ts = require(`gulp-typescript`);
const tsProject = ts.createProject(`tsconfig.json`);

var knownOptions = {
  string: `env`,
  default: { env: process.env.NODE_ENV || `production` }
};

var options = minimist(process.argv.slice(2), knownOptions);

const devBuild = options.env === `development`;
const preprocessContext = { DEBUG: true };
const env = devBuild ? `debug` : `release`;

//#region HTML
function buildHtml()
{
  return gulp
    .src(`./src/html/index.html`)
    .pipe(preprocess({ includeBase: `./build/${ env }/pre`, extension: `html` }))
    .pipe(minifyHTML())
    .pipe(gulp.dest(`./build/${ env }/www`));
}
//#endregion HTML

//#region CSS
function buildCss()
{
  return gulp
    .src(`./src/css/*.css`)
    .pipe(minifyCSS())
    .pipe(gulp.dest(`./build/${ env }/www`));
}
//#endregion CSS

//#region JS
function preprocessJs()
{
  if (devBuild)
  {
    return gulp.src(`./build/js/**/*.js`, { base: `./build/js/` })
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(preprocess({ context: preprocessContext }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(`./build/${ env }/pre`));
  }
  else
  {
    return gulp.src(`./build/js/**/*.js`, { base: `./build/js/` })
      .pipe(preprocess({ context: {} }))
      .pipe(gulp.dest(`./build/${ env }/pre`));
  }
}

let cache;
function rollupJs()
{
  return rollup.rollup({
    cache,
    input: `./build/${ env }/pre/game.js`,
    plugins: [
      rollupSourcemaps(),
      rollupTerser({
        compress: {
          passes: 20
        },
        toplevel: true,
        mangle: {
          properties: {
            regex: /^_.*/
          }
        }
      })
    ]
  }).then(bundle =>
  {
    cache = bundle.cache;
    return bundle.write({
      file: `./build/${ env }/www/game.js`,
      format: `iife`,
      name: `game`,
      sourcemap: devBuild
    });
  });
}
//#endregion JS

//#region TS
function compileTS()
{
  return gulp.src(`src/ts/**/*.ts`)
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`build/js`));
}
//#endregion TS

//#region PNG
function cleanPng()
{
  return gulp
    .src(`./build/${ env }/www/*.png`, {
      read: false,
    })
    .pipe(clean());
}

function buildPng()
{
  return gulp
    .src(`src/res/*.png`)
    .pipe(imagemin([imagemin.optipng({ optimizationLevel: 7 })]))
    .pipe(gulp.dest(`./dist/src/`))
    .pipe(gulp.dest(`./build/${ env }/www/`));
}
//#endregion PNG

//#region JSON
function cleanJson()
{
  return gulp
    .src(`./build/${ env }/pre/*.json`, {
      read: false,
    })
    .pipe(clean());
}

function buildJson()
{
  return gulp
    .src(`src/res/*.json`)
    .pipe(jsonMinify())
    .pipe(gulp.dest(`./build/${ env }/pre`));
}
//#endregion JSON

function watch()
{
  gulp.watch([`./src/res/*.png`], gulp.series(cleanPng, buildPng));
  gulp.watch([`./src/res/*.json`], gulp.series(cleanJson, buildJson, buildHtml));
  gulp.watch([`./src/html/index.html`], gulp.series(cleanJson, buildJson, buildHtml));
  gulp.watch([`./src/css/*.css`], buildCss);
  gulp.watch([`./src/ts/**/*.ts`], gulp.series(compileTS, preprocessJs, rollupJs));
}

const build = exports.build =
  gulp.series(compileTS,
    gulp.parallel(
      gulp.series(cleanPng, buildPng),
      gulp.series(cleanJson, buildJson, buildHtml),
      gulp.series(preprocessJs, rollupJs),
      buildCss));

exports.watch = gulp.series(build, watch);