import gulp, { series, parallel } from "gulp";

import del from "del";
import rename from "gulp-rename";
import plumber from "gulp-plumber";
import ghPages from "gulp-gh-pages";
import browserSync from "browser-sync";
import sourcemaps from "gulp-sourcemaps";

import gpug from "gulp-pug";

import sass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import cleanCSS from "gulp-clean-css";

import image from "gulp-imagemin";

import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";

import browserify from "browserify";
import babelify from "babelify";
import uglify from "gulp-uglify";

browserSync.create("browser");

const paths = {
  pug: {
    watch: "src/assets/views/**/*.pug",
    src: "src/assets/views/*.pug",
    dest: "dist",
  },
  img: {
    watch: "src/assets/img/**/*",
    src: "src/assets/img/*",
    dest: "dist/static/img",
  },
  scss: {
    watch: "src/assets/scss/**/*.scss",
    src: "src/assets/scss/styles.scss",
    dest: "dist/static/css",
  },
  js: {
    watch: "src/assets/js/**/*.js",
    src: "src/assets/js/main.js",
    dest: "dist/static/js",
  },
};

export const pug = () =>
  gulp
    .src(paths.pug.src)
    .pipe(plumber())
    .pipe(gpug())
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(browserSync.stream());

export const styles = () =>
  gulp
    .src(paths.scss.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write("./maps"))
    .pipe(gulp.dest(paths.scss.dest))
    .pipe(browserSync.stream());

export const js = () =>
  browserify(paths.js.src, { debug: true })
    .transform(
      babelify.configure({
        presets: ["@babel/preset-env"],
      })
    )
    .bundle()
    .pipe(source("main.js"))
    .pipe(buffer())
    .pipe(plumber())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(rename("main.min.js"))
    .pipe(sourcemaps.write("./maps"))
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browserSync.stream());

export const img = () =>
  gulp.src(paths.img.src).pipe(image()).pipe(gulp.dest(paths.img.dest));

export const clean = () => del(["dist", ".publish"]);

export const server = () =>
  browserSync.init({
    server: {
      baseDir: "dist",
    },
    open: false,
  });

export const watch = (cb) => {
  gulp.watch(paths.pug.watch, pug);
  gulp.watch(paths.scss.watch, styles);
  gulp.watch(paths.js.watch, js);
  cb();
};

export const gh = () => gulp.src("dist/**/*").pipe(ghPages());

export const prepare = series([clean, img]);

export const assets = series([pug, styles, js]);

export const live = parallel([server, watch]);

export const build = series([prepare, assets]);

export const dev = series([build, live]);

export const deploy = series([build, gh, clean]);
