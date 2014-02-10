module.exports = function(mongoose) {
	var Schema = mongoose.Schema;

	var GameObjectSchema = new Schema({
		name: {
			type: String,
			required: true,
			lowercase: true,
			trim: true
		},
		branch: [{
			type: Schema.ObjectId,
		}],
		description: {
			type: String,
			trim: true
		},
		parent: {
			type: Schema.ObjectId,
			ref: "GameObject",
		},
		project: {
			type: Schema.ObjectId,
			ref: "Project",
			required: true
		},
		files: [{
			type: Schema.ObjectId,
			ref: "ObjectFile"
		}]
	}, { collection: "game_objects" });

	mongoose.model('GameObject', GameObjectSchema);
	return mongoose.model('GameObject');
}
