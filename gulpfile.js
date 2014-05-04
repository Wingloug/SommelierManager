var gulp = require('gulp');
var gulp_plugins = require('gulp-load-plugins')();
var fs = require('fs');

// Paths a procesar.
var temp = JSON.parse(fs.readFileSync(__dirname + '/css_paths.json'));
var paths = {
	scripts: JSON.parse(fs.readFileSync(__dirname + '/js_paths.json')),
	css: temp.css,
	fonts: temp.fonts
};

gulp.task('clean', function() {
	return gulp.src(['public/js/plugins', 'public/fonts'], {
		read: false
	}).pipe(gulp_plugins.clean());
});

// CSS
gulp.task('css', function() {
	return gulp.src(paths.css)
		// .pipe(plugins.concat('client.css'))
		// .pipe(gulp.dest('public/css'))
		// .pipe(gulp_plugins.minifyCss({
		// 		keepSpecialComments: 0
		// 	}))
		// .pipe(plugins.concat('client.min.css'))
		.pipe(gulp.dest('public/css'));
});

gulp.task('fonts', function() {
	return gulp.src(paths.fonts)
		.pipe(gulp.dest('public/fonts'));
});

// Librerias que se deben comprimir.
// gulp.task('js', function() {
//   return gulp.src([
//     'public/bower_components/zxcvbn/zxcvbn.js',
//     'public/bower_components/json2/json2.js'
//   ])
//     .pipe(plugins.uglify({
//         compress: {
//           negate_iife: false
//         }
//       }))
//     .pipe(gulp.dest('dist/js'));
// });

// Scripts (js.cfg)
// gulp.task('scripts', function() {
//   return gulp.src(paths.scripts)
//     .pipe(plugins.concat('client.js'))
//     .pipe(gulp.dest('dist'));
//   gulp.src(paths.scripts)
//     .pipe(plugins.uglify({
//         compress: {
//           negate_iife: false
//         }
//       }))
//     .pipe(plugins.concat('client.min.js'))
//     .pipe(gulp.dest('dist'));
// });

// JS plugins
gulp.task('scripts', function() {
	return gulp.src(paths.scripts)
		.pipe(gulp_plugins.uglify({
				compress: {
					negate_iife: false
				}
			}))
		.pipe(gulp.dest('public/js/plugins'));
});

// gulp.task('watch', function() {
// 	gulp.watch(paths.plugins, ['plugins']);
// });

gulp.task('default', [
	'css',
	'fonts',
	'scripts'
]);
