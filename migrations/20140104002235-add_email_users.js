module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.addColumn("users", "email", {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: true
		});
		done()
	},
	down: function(migration, DataTypes, done) {
		// add reverting commands here, calling 'done' when finished
		migration.removeColumn("users", "email");
		done()
	}
}
