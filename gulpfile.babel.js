import gulp, { series, parallel } from "gulp";

import del from "del";
import rename from "gulp-rename";
import plumber from "gulp-plumber";
import browserSync from "browser-sync";
import sourcemaps from "gulp-sourcemaps";

import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";

import image from "gulp-imagemin";

import gpug from "gulp-pug";
import htmlmin from "gulp-htmlmin";

import sass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import cleanCSS from "gulp-clean-css";

import browserify from "browserify";
import babelify from "babelify";
import uglify from "gulp-uglify";

import ghPages from "gulp-gh-pages";

browserSync.create("browser");

const paths = {
  pug: {
    watch: "src/views/**/*.pug",
    src: "src/views/*.pug",
    dest: "dist",
  },
  html: {
    watch: "src/**/*.html",
    src: "src/*.html",
    dest: "dist",
  },
  img: {
    watch: "src/img/**/*",
    src: "src/img/*",
    dest: "dist/img",
  },
  scss: {
    watch: "src/scss/**/*.scss",
    src: "src/scss/styles.scss",
    dest: "dist/css",
  },
  js: {
    watch: "src/js/**/*.js",
    src: "src/js/main.js",
    dest: "dist/js",
  },
};

export const pug = () =>
  gulp
    .src(paths.pug.src)
    .pipe(plumber())
    .pipe(gpug())
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(browserSync.stream());

export const html = () =>
  gulp
    .src(paths.html.src)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(browserSync.stream());

export const scss = () =>
  gulp
    .src(paths.scss.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cleanCSS())
    .pipe(rename("styles.min.css"))
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
  gulp.watch(paths.html.watch, html);
  gulp.watch(paths.scss.watch, scss);
  gulp.watch(paths.js.watch, js);
  cb();
};

export const gh = () => gulp.src("dist/**/*").pipe(ghPages());

export const prepare = series([clean, img]);

export const assets = series([pug, html, scss, js]);

export const live = parallel([server, watch]);

export const build = series([prepare, assets]);

export const dev = series([build, live]);

export const deploy = series([build, gh, clean]);
