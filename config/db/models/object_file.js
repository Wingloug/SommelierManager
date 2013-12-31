module.exports = function(sequelize, DataTypes) {
	// Archivos asociados a un objeto del juego en particular. Pueden ser imágenes, archivos de audio, video, texto y otros.

	var uuid = require("node-uuid");

	var model = sequelize.define('object_file', {
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
			defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
		},
		filename: {
			type: DataTypes.STRING,
			allowNull: true,
			unique: true,
		},
		original_filename: {
			type: DataTypes.STRING,
			allowNull: false
		},
		path: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: "",
		},
		extension : {
			type: DataTypes.STRING,
		},
		type: {
			type: DataTypes.ENUM,
			values: ["image", "audio", "video", "text", "other"],
			defaultValue: "image"
		},
		description: {
			type: DataTypes.STRING,
			allowNull: true
		},
		game_object_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "game_objects",
			referencesKey: "id",
			allowNull: false
		},
		uploaded_by: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "users",
			referencesKey: "id",
			allowNull: false
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		}
	});

	model.setExtension = function(object_file, callback) {
		var name = object_file.original_filename;
		var ext = name.split(".")[1];
		ext = "." + ext;

		callback(ext);
	}

	model.setFilename = function(object_file, callback) {
		var name = uuid.v4();
		name = name.replace(/-/g, "");
		var ext = object_file.extension;
		name = name + ext;

		callback(name);
	}

	model.saveRecord = function(object, callback) {
		var temp = model.build(object);

		model.setExtension(temp, function(ext) {
			temp.extension = ext;
		});
		model.setFilename(temp, function(filename) {
			temp.filename = filename;
		}) ;

		temp.save().success(function() {
			if (callback) {
				callback();
			}
		}).error(function() {
			if (callback)
				callback();
		})
	}

	return model;

}
