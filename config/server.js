module.exports = function(app, express) {
	var stylus = require('stylus');
	var nib = require("nib");
	var Sequelize = require("sequelize");
	var uuid = require("node-uuid");
	var flash = require("connect-flash");
	var mongoose = require("mongoose");

	mongoose.connect('mongodb://localhost/prototipo_dev');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		var test = require(app.root + "/db/models")(app.root, mongoose);
	});

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

	var sequelize = new Sequelize('prototipo_dev', 'admin_prototipo', 'admin', {
		host: 'localhost',
		port: 3306,
		// protocol: 'tcp',
		// logging: true,
		// maxConcurrentQueries: 50,
		dialect: 'mysql',
		define: {
			underscored: true,
			freezeTableName: false,
			syncOnAssociation: true,
			charset: 'latin1',
			collate: 'latin1_spanish_ci',
			timestamps: true
		},

		language: 'en'
	});

	var models = require(app.root + "/config/db/models/models")(app.root, sequelize);

	app.locals.username = function(id) {
		models.User.find(id).success(function(user) {
			return user.username
		});
	}

	return models;
};
