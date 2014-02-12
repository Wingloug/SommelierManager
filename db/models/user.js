module.exports = function(mongoose) {
	var Schema = mongoose.Schema;

	var UserSchema = new Schema({
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true
		},
		password: {
			type: String,
			required: true
		},
		email: {
			type: String,
			lowercase: true
		},
		name: {
			type: String,
			default: "",
			lowercase: true,
			trim: true
		},
		last_name: {
			type: String,
			default: "",
			lowercase: true,
			trim: true
		},
		role: {
			type: String,
			enum: ["admin", "user"],
			default: "user"
		},
		projects: [{
			type: Schema.ObjectId,
			ref: "Project"
		}],
		objects: [{
			game_object: {
				type: Schema.ObjectId,
				ref: "GameObject"
			},
			task: {
				type: String,
				enum: ["code", "music", "design"],
				default: "code"
			},
			task_description: {
				type: String,
				default: "",
				trim: true
			},
			progress: {
				type: Number,
				min: 0,
				max: 100,
				default: 0
			},
			board: {
				type: Schema.ObjectId,
				ref: "Board"
			}
		}]
	}, { collection: 'users' });

	mongoose.model('User', UserSchema);
	return mongoose.model('User');
}
