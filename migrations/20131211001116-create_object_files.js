module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("object_files", {
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
			},
			filename: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true
			},
			original_filename: {
				type: DataTypes.STRING,
				allowNull: false
			},
			path: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: ""
			},
			extension : {
				type: DataTypes.STRING,
			},
			type: {
				type: DataTypes.ENUM,
				values: ["image", "audio", "video", "text", "other"],
				defaultValue: "image"
			},
			description: {
				type: DataTypes.STRING,
				allowNull: true
			},
			game_object_id: {
				type: DataTypes.INTEGER.UNSIGNED,
				references: "game_objects",
				referencesKey: "id",
				allowNull: false
			},
			uploaded_by: {
				type: DataTypes.INTEGER.UNSIGNED,
				references: "users",
				referencesKey: "id",
				allowNull: false
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
		migration.dropTable("object_files");
		done();
	}
}
