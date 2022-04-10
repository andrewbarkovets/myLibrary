// Сборка Gulp:
// Настройка gulp, настройка обрабодки html, scss, js, img
// а так же server

//Импорт пакетов для работы с gulp, gulp-html, gulp-scss и т.д.
// gulp
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import browserSync from 'browser-sync';
import plumber from 'gulp-plumber';
import del from 'del';
import rename from 'gulp-rename';

//html
import htmlMin from 'gulp-htmlmin';

//css
import sass from 'sass';
import gulpSass from 'gulp-sass';
const cSass = gulpSass(sass);

import sourcemaps from 'gulp-sourcemaps'
import autoprefixer from 'gulp-autoprefixer';
import cleanCss from 'gulp-clean-css';
import gcmq from 'gulp-group-css-media-queries';
import {
    stream as critical
} from 'critical';

//js
import webpack from 'webpack-stream';
import terser from 'gulp-terser';

//image
import gulpImage from 'gulp-image';
import gulpWebp from 'gulp-webp';
import gulpAvif from 'gulp-avif';

// Сборка по умолчанию false!
let dev = false;
// let prod = true; === !dev

// Объек path с сохраненными путями до файлов:
const path = {
    // src - откуда берем файлы
    src: {
        // base - основная папка от которой отталкиваемся
        base: 'src/',
        html: 'src/*.html',
        scss: 'src/scss/**/*.scss',
        js: 'src/js/index.js',
        img: 'src/img/**/*.{jpg,svg,jpeg,png,gif}',
        imgF: 'src/img/**/*.{jpg,jpeg,png}',
        assets: ['src/fonts/**/*.*', 'src/icons/**/*.*'],
    },
    // dist - куда складываем файлы
    dist: {
        base: 'dist/',
        html: 'dist/',
        css: 'dist/css/',
        js: 'dist/js/',
        img: 'dist/img/',
    },
    // watch - следит за несколькими файлами
    watch: {
        html: 'src/*.html',
        scss: 'src/scss/**/*.scss',
        js: 'src/js/**/*.*',
        img: 'src/img/**/*.{jpg,svg,jpeg,png,gif}',
        imgF: 'src/img/**/*.{jpg,jpeg,png}',
    }
};

// TASK ...
// task будет оброщаться к ядру gulp, и оттуда, с помощью метода src,
// доставать файлы из обьекта pash!
// task HTML
export const html = () => gulp
    .src(path.src.html)
    // .pipe - передает полученный файл в колбэк функцию
    // gulpIf - определяет - сейчас dev-сборка или нет
    // htmlMin - обрабатывает html с помощью настроек
    .pipe(gulpIf(!dev, htmlMin({
        // removeComments - убирет кмментарии
        removeComments: true,
        // collapseWhitespace - убирает не нужные пробелы и переносы строк
        collapseWhitespace: true,
    })))
    // с помощью команды gulp.dest - ложим html в path.dist.html
    .pipe(gulp.dest(path.dist.html))
    // browserSync.stream - используется для внесения изменений без обновления страницы
    .pipe(browserSync.stream());

// task SCSS
export const scss = () => gulp
    .src(path.src.scss)
    .pipe(gulpIf(dev, sourcemaps.init()))
    .pipe(cSass().on('error', cSass.logError))
    .pipe(gulpIf(!dev, autoprefixer(({
        cascade: false,
    }))))
    .pipe(gulpIf(!dev, gcmq()))
    .pipe(gulpIf(!dev, gulp.dest(path.dist.css)))
    .pipe(gulpIf(!dev, cleanCss({
        2: {
            specialComments: 0,
        }
    })))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(dev, sourcemaps.write()))
    .pipe(gulp.dest(path.dist.css))
    .pipe(browserSync.stream());


// task JS
const configWebpack = {
    mode: dev ? 'development' : 'production',
    devtool: dev ? 'eval-source-map' : false,
    optimization: {
        minimize: false,
    },
    output: {
        filename: 'index.js'
    },
    module: {
        rules: []
    }
};

if (!dev) {
    configWebpack.module.rules.push({
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
        }
    });
}

export const js = () => gulp
    .src(path.src.js)
    .pipe(plumber())
    .pipe(webpack(configWebpack))
    .pipe(gulpIf(!dev, gulp.dest(path.dist.js)))
    .pipe(gulpIf(!dev, terser()))
    .pipe(rename({
        suffix: '.min',
    }))
    .pipe(gulpIf(!dev, gulp.dest(path.dist.js)))
    .pipe(gulp.dest(path.dist.js))
    .pipe(browserSync.stream());

// task IMAGES
const image = () => gulp
    .src(path.src.img)
    .pipe(gulpIf(!dev, gulpImage({
        optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
        pngquant: ['--speed=1', '--force', 256],
        zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
        jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
        mozjpeg: ['-optimize', '-progressive'],
        gifsicle: ['--optimize'],
        svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
    })))
    .pipe(gulp.dest(path.dist.img))
    .pipe(browserSync.stream({
        once: true,
    })
    );

const webp = () => gulp
    .src(path.src.img)
    .pipe(gulpWebp({
        quality: dev ? 100 : 70
    }))
    .pipe(gulp.dest(path.dist.img))
    .pipe(browserSync.stream({
        once: true,
    })
    );

export const avif = () => gulp
    .src(path.src.img)
    .pipe(gulpAvif({
        quality: dev ? 100 : 50
    }))
    .pipe(gulp.dest(path.dist.img))
    .pipe(browserSync.stream({
        once: true,
    })
    );

export const copy = () => gulp
    .src(path.src.assets, {
        base: path.src.base,
    })
    .pipe(gulp.dest(path.dist.base))
    .pipe(browserSync.stream({
        once: true,
    })
    );

// Настройка server
export const server = () => {
    browserSync.init({
        // отлючение ui
        ui: false,
        // отключение уведомлений
        notify: false,
        host: 'localhost',
        // показывает проект в интернете на временном хостинге
        //tunnel: true,
        server: {
            baseDir: path.dist.base,
        }
    });

    //gulp.watch отслеживает файлы path и после изминения в них, вызывает Task
    gulp.watch(path.watch.html, html);
    gulp.watch(path.watch.scss, scss);
    gulp.watch(path.watch.js, js);
    gulp.watch(path.watch.img, image);
    gulp.watch(path.watch.imgF, gulp.parallel(webp, avif));
    gulp.watch(path.src.assets, copy);
};

// функция очищает папку dist
export const clear = () => del(path.dist.base, {
    force: true,
})
// develop - принимает действие и возврощает ready
const develop = (ready) => {
    dev = true;
    ready();
};

// gulp.parallel запускает несколько task
export const base = gulp.parallel(html, scss, js, image, avif, webp, copy);
// build - очищает папку dist  и затем запускает base
export const build = gulp.series(clear, base);
// с начала запуститься develop-режим, потом base, затем server
export default gulp.series(develop, base, server);