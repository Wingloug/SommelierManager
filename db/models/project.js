module.exports = function(mongoose) {
	var Schema = mongoose.Schema;

	var ProjectSchema = new Schema({
		name: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true
		},
		progress: {
			type: Number,
			default: 0,
			min: 0,
			max: 100
		},
		status: {
			type: String,
			enum: ["active", "paused", "completed"],
			default: "active"
		},
		created_by: {
			type: Schema.ObjectId,
			ref: 'User'
		}
	}, { collection: 'projects' });

	mongoose.model('Project', ProjectSchema);
	return mongoose.model('Project');
}
