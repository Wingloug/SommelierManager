var express = require("express")
	, http = require("http")
	, app = express();

app.root = __dirname;

var models = require("./config/server")(app, express);

// Rutas
require("./config/routes")(app, models);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
