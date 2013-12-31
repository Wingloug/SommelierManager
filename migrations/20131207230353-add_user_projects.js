module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.addColumn("projects", "created_by", {
			type: DataTypes.INTEGER.UNSIGNED,
			references: "users",
			referencesKey: "id",
			allowNull: false,
		});
		done()
	},
	down: function(migration, DataTypes, done) {
		// add reverting commands here, calling 'done' when finished
		migration.removeColumn("projects", "created_by");
		done();
	}
}
