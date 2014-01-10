module.exports = function(sequelize, DataTypes) {
	// Usuarios de la plataforma. Pueden crear proyectos y objetos.
	var bcrypt = require('bcrypt');

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
		email: {
			type: DataTypes.STRING,
			allowNull: true
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

		temp.username = temp.username.toLowerCase();

		bcrypt.hash(object.password, 8, function(err, hash) {
			if (err) {
				callback(null, err);
			}

			temp.password = hash;
			temp.save().success(function(user) {
				if (callback) {
					callback(user);
				}
			}).error(function(err) {
				if (callback) {
					callback(err);
				}
			});
		});
	}

	return model;
}
