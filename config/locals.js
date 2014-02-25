module.exports = function(app, mongoose, models) {
	app.locals.user = {};
	var id = new mongoose.Types.ObjectId("530a79d61e619f6037b5c28f");
	models.User.findById(id).exec(function(err, response) {
		if (response) {
			app.locals.user = response;
		}
		else {
			app.locals.user = {};
		}
	});

	app.locals.crumbs = [];
	app.locals.children = [];

}
