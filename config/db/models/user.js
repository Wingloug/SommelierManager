module.exports = function(sequelize, DataTypes) {
	// Usuarios de la plataforma. Pueden crear proyectos y objetos.

	var model =  sequelize.define('user', {
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: ""
		},
		last_name: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: ""
		},
		role: {
			type: DataTypes.ENUM,
			values: ["admin", "user"],
			defaultValue: "user"
		}
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
