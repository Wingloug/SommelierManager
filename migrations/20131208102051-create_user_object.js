module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("user_object", {
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
		});
		done()
	},
	down: function(migration, DataTypes, done) {
		// add reverting commands here, calling 'done' when finished
		migration.dropTable("user_object");
		done()
	}
}
