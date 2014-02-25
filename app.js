var express = require("express")
	, http = require("http")
	, app = express();

app.root = __dirname;

require("./config/server")(app, express);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
