module.exports = function(sequelize, DataTypes) {
	// Proyectos iniciados. Puede tener muchos objetos de juego asociados.

	var model =  sequelize.define('project', {
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		progress: {
			type: DataTypes.FLOAT.UNSIGNED,
			defaultValue: 0
		},
		status: {
			type: DataTypes.ENUM,
			values: ["active", "paused", "completed"],
			defaultValue: "active"
		},
		created_by: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "users",
			referencesKey: "id",
			allowNull: false
		}
	});

	model.saveRecord = function(object, callback) {
		var temp = model.build(object);
		if (!object.progress) {
			temp.progress = 0.0;
		}

		if (!object.status) {
			temp.status = "active";
		}

		temp.save().success(function(project) {
			if (callback) {
				callback(project);
			}
		}).error(function(err) {
			if (callback) {
				callback(null, err);
			}
		});
	}

	return model;
}
