var express = require("express")
	, http = require("http")
	, app = express()
	, mongoose = require("mongoose");

app.root = __dirname;

require("./config/server")(app, express);

var models =  require(app.root + "/db/models")(app.root, mongoose);
// Rutas
require("./config/routes")(app, models);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
