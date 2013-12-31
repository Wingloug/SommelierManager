module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("board_items", {
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
			},
			board_id: {
				type: DataTypes.INTEGER.UNSIGNED,
				references: "boards",
				referencesKey: "id",
				allowNull: false
			},
			container: {
				type: DataTypes.ENUM,
				values: ["todo", "doing", "done"],
				defaultValue: "todo"
			},
			description: {
				type: DataTypes.STRING,
				defaultValue: ""
			},
			label: {
				type: DataTypes.STRING,
				defaultValue: "default"
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
		migration.dropTable("board_items");
		done()
	}
}
