module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("game_objects", {
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true,
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
			},
			branch: {
				type: DataTypes.STRING,
				defaulValue: ""
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
		done();
	},
	down: function(migration, DataTypes, done) {
		// add reverting commands here, calling 'done' when finished
		migration.dropTable("game_objects");
		done();
	}
}
