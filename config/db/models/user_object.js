module.exports = function(sequelize, DataTypes) {
	// Define los objetos asociados a un usuario, el rol que debe cumplir, descripción de la macro tarea y el progreso de la misma.

	var model =  sequelize.define('user_object', {
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
			defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
		},
		user_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "users",
			referencesKey: "id",
			allowNull: false
		},
		game_object_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "game_objects",
			referencesKey: "id",
			allowNull: false
		},
		project_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "projects",
			referencesKey: "id",
			allowNull: true,
		},
		role: {
			type: DataTypes.STRING,
			allowNull: false
		},
		task_description: {
			type: DataTypes.TEXT,
			defaultValue: ""
		},
		progress: {
			type: DataTypes.FLOAT.UNSIGNED,
			defaultValue: DataTypes.FLOAT.UNSIGNED.ZERO
		}
	}, {
		freezeTableName: true,
		timestamps: false
	});

	model.saveRecord = function(object, callback) {
		var temp = model.build(object);

		temp.save().success(function() {
			if (callback) {
				callback();
			}
		}).error(function() {
			if (callback) {
				callback();
			}
		});
	}

	return model;
}
