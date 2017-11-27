// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    newer = require('gulp-newer'),
    imagemin = require('gulp-imagemin'),
    pug = require('gulp-pug2'),
    spawn = require('child_process').spawn,
    node,

    // folders
    folder = {
        src: 'src/',
        dist: 'dist/',
        assets: 'public'
    },

    ts = require("gulp-typescript"),
    tsProject = ts.createProject("tsconfig.json"),
    browserSync = require('browser-sync').create();

// Lint Task
gulp.task('lint', function() {
    return gulp.src('public/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('assets', function() {
    var out = folder.dist + 'public/';
    return gulp.src('public/**/*')
        .pipe(gulp.dest(out));
});

gulp.task("scripts", function() {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(folder.dist));
});

gulp.task('views', function() {
    var out = folder.dist + 'views/';
    return gulp.src('views/**/*.pug')
        .pipe(gulp.dest(out));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('public/**/*', ['assets']);

    gulp.watch('src/**/*.ts', ['scripts']);

    gulp.watch('views/**/*.pug', ['views']);
});

// Default Task
gulp.task('default', ['lint', 'assets', 'scripts', 'views']);