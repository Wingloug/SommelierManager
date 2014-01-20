module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.addColumn("users", "email", {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: ""
		});
		done()
	},
	down: function(migration, DataTypes, done) {
		// add reverting commands here, calling 'done' when finished
		migration.removeColumn("users", "email");
		done()
	}
}
