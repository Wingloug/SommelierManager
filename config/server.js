module.exports = function(app, express) {
	var stylus = require('stylus');
	var nib = require("nib");
	var uuid = require("node-uuid");
	var flash = require("connect-flash");
	var mongoose = require("mongoose");
	var expressValidator = require('express-validator');

	function compile(str, path) {
		console.log("compile " + path);
		return stylus(str)
			.set('filename', path)
			.set('compress', true)
			.use(nib());
	}

	app.configure('development', function() {
		app.set('port', process.env.PORT || 3000);
		app.set('views', app.root + '/views');
		app.set('view engine', 'jade');
		app.set('view options', { doctype : 'html', pretty : true });
		app.use(express.favicon());
		app.use(express.logger('dev'));
		app.use(express.compress());
		app.use(express.bodyParser());
		app.use(expressValidator());
		app.use(express.methodOverride());
		app.use(express.cookieParser('your secret here'));
		app.use(express.session());
		app.use(stylus.middleware({
			// force: true,
			// firebug: true,
			// compress: true,
			linenos: true,
			src: app.root,
			dest: app.root + '/public',
			compile: compile
		}));
		app.use(express.static(app.root + '/public'));
		app.use(flash());
		app.use(app.router);
		app.use(express.errorHandler());
	});

	app.configure('production',function(){
		app.set('views', app.root + '/views');
		app.set('view engine', 'jade');
		app.set('view options', { doctype : 'html', pretty : true });
		app.use(express.compress());
		app.use(express.bodyParser());
		app.use(express.cookieParser());
		// app.use(express.cookieParser('your secret here'));
		app.use(express.session());
		var oneYear = 31557600000;
		app.use(express.static(app.root + '/public'), { maxAge: oneYear });
		app.use(flash());
		app.use(app.router);
		app.use(express.methodOverride());
		app.use(express.errorHandler());
	});

	mongoose.connect('mongodb://localhost/prototipo_dev');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
	});
};
