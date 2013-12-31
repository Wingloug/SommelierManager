module.exports = function(sequelize, DataTypes) {
	// Boards "to do" propio de cada relación user - game_object.
	// Al comparar items_count con la cantidad de items contenidos marcados como "done" se determina el progreso.

	var model =  sequelize.define('board', {
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
			defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
		},
		user_object_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "user_object",
			referencesKey: "id",
			allowNull: false
		},
		items_count: {
			type: DataTypes.INTEGER.UNSIGNED,
			defaultValue: 0
		},
		completed_count: {
			type: DataTypes.INTEGER.UNSIGNED,
			defaultValue: 0
		}
	});

	model.saveRecord = function(object, callback) {
		var temp = model.build(object);

		temp.save().success(function(board) {
			if (callback) {
				callback(board);
			}
		}).error(function(err) {
			if (callback) {
				callback(null, err);
			}
		});
	}

	return model;
}
