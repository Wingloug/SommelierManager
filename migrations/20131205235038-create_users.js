module.exports = {
	up: function(migration, DataTypes, done) {
		// add altering commands here, calling 'done' when finished
		migration.createTable("users", {
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				defaultValue: DataTypes.INTEGER.UNSIGNED.ZERO
			},
			username: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
			}
			name: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: ""
			},
			last_name: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: ""
			},
			role: {
				type: DataTypes.ENUM,
				values: ["admin", "user"],
				defaultValue: "user"
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
		migration.dropTable("users");
		done()
	}
}
