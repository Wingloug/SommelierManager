module.exports = function(path, sequelize) {
	var User = sequelize.import(path+ "/config/db/models/user");
	var Project = sequelize.import(path + "/config/db/models/project");
	var GameObject = sequelize.import(path + "/config/db/models/game_object");
	var UserProject = sequelize.import(path + "/config/db/models/user_project");
	var UserObject = sequelize.import(path + "/config/db/models/user_object");
	var ObjectFile = sequelize.import(path + "/config/db/models/object_file");
	var Board = sequelize.import(path + "/config/db/models/board");
	var BoardItem = sequelize.import(path + "/config/db/models/board_item");

	return {
		User: User,
		Project: Project,
		GameObject: GameObject,
		UserProject: UserProject,
		UserObject: UserObject,
		ObjectFile: ObjectFile,
		Board: Board,
		BoardItem: BoardItem
	}
}
