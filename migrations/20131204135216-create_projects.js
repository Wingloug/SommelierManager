module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("projects", {
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			progress: {
				type: DataTypes.FLOAT.UNSIGNED,
				defaultValue: DataTypes.FLOAT.UNSIGNED.ZERO
			},
			status: {
				type: DataTypes.ENUM,
				values: ["active", "paused", "completed"],
				defaultValue: "active"
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
		migration.dropTable("projects");
		done()
	}
}
