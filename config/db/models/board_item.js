module.exports = function(sequelize, DataTypes) {
	// Items de cada board.

	var model =  sequelize.define('board_item', {
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
			defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
		},
		board_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "boards",
			referencesKey: "id",
			allowNull: false
		},
		container: {
			type: DataTypes.ENUM,
			values: ["todo", "doing", "done"],
			defaultValue: "todo"
		},
		description: {
			type: DataTypes.STRING,
			defaultValue: ""
		},
		label: {
			type: DataTypes.STRING,
			defaultValue: "default"
		},
	});

	model.saveRecord = function(object, callback) {
		var temp = model.build(object);

		temp.save().success(function(item) {
			if (callback) {
				callback(item);
			}
		}).error(function(err) {
			if (callback) {
				callback(null, err);
			}
		});
	}

	return model;
}
