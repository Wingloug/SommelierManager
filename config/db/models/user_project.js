module.exports = function(sequelize, DataTypes) {
	// Define los proyectos en los que un usuario participa. Sólo éstos son visibles para un usuario normal (role: user)

	var model =  sequelize.define('user_project', {
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
		project_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "projects",
			referencesKey: "id",
			allowNull: false
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
