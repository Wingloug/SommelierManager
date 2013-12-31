module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("user_project", {
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
		});
		done()
	},
	down: function(migration, DataTypes, done) {
		// add reverting commands here, calling 'done' when finished
		migration.dropTable("user_project");
		done()
	}
}
