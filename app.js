var express = require("express")
	, http = require("http")
	, app = express()
	, mongoose = require("mongoose");

app.root = __dirname;

require("./config/server")(app, express);

var models =  require(app.root + "/db/models")(app.root, mongoose);

app.locals.user = {};
var id = new mongoose.Types.ObjectId("52f84ef58f6a11cf3a28473d");
models.User.findById(id).exec(function(err, response) {
	// app.user.id = response.id;
	// app.user.username = response.username;
	// app.user.projects = [];
	// var projects = [];
	// for (var i = 0; i < response.projects.length; i++) {
	// 	projects.push(response.projects[i]);
	// }
	// app.user.projects = projects;
	app.locals.user = response;
});
// Rutas
require("./config/routes")(app, models);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
