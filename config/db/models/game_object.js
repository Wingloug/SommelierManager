module.exports = function(sequelize, DataTypes) {
	// Objetos del juego pertenecientes a un projecto en particular. Pueden tener otros objetos hijos.
	var model =  sequelize.define('game_object', {
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		branch: {
			type: DataTypes.STRING,
			defaulValue: "",
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		parent_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "game_objects",
			referencesKey: "id",
			allowNull: true,
		},
		project_id: {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "projects",
			referencesKey: "id",
			allowNull: false,
		}
	});

	function setBranch(object, callback) {
		if (object.parent_id) {
			model.find(object.parent_id).success(function(result) {
				if (result) {
					if (result.branch == "") {
						var branch = result.branch + result.id;
						callback(branch);
					}
					else {
						var branch = result.branch + "," + result.id;
						callback(branch);
					}
				}
			}).error(function() {
				callback(null);
			});
		}
		else {
			callback(null);
		}

	}

	model.saveRecord = function(object, callback) {
		var temp = model.build(object);

		setBranch(temp, function(branch) {
			if (branch) {
				console.log("branch " + branch);
				temp.branch = branch;
			}
			temp.save().success(function() {
				if(callback) {
					callback();
				}
			}).error(function() {
				if (callback) {
					callback();
				}
			});
		});
	}

	return model;
}
