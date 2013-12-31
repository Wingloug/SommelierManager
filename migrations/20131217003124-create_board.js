module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("boards", {
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
			},
			user_object_id: {
				type: DataTypes.INTEGER.UNSIGNED,
				references: "user_object",
				referencesKey: "id",
				allowNull: false
			},
			items_count: {
				type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: 0
			},
			completed_count: {
				type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: 0
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
		done()
	},
	down: function(migration, DataTypes, done) {
		// add reverting commands here, calling 'done' when finished
		migration.dropTable("boards");
		done()
	}
}
