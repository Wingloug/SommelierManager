module.exports = function(root, mongoose) {
	var models = {};
	models.Project = require(root + "/db/models/project")(mongoose);
	models.GameObject = require(root + "/db/models/game_object")(mongoose);
	models.File = require(root + "/db/models/file")(mongoose);
	models.Board = require(root + "/db/models/board")(mongoose);
	models.User = require(root + "/db/models/user")(mongoose);
	return models;
}
