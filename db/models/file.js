module.exports = function(mongoose) {
	var Schema = mongoose.Schema;

	var ObjectFileSchema = new Schema({
		filename: {
			type: String,
			unique: true,
			trim: true
		},
		original_filename: {
			type: String,
			required: true,
			trim: true
		},
		path: {
			type: String,
			default: ""
		},
		extension : {
			type: String,
		},
		type: {
			type: String,
			enum: ["image", "audio", "video", "text", "other"],
			default: "image"
		},
		description: {
			type: String,
			trim: true
		},
		game_object: {
			type: Schema.ObjectId,
			ref: "GameObject",
			required: true
		},
		uploaded_by: {
			type: Schema.ObjectId,
			ref: "User",
			required: true
		},
		created_at: {
			type: Date
		},
		updated_at: {
			type: Date,
			default: Date.now
		}
	}, { collection: "object_files" });

	mongoose.model('ObjectFile', ObjectFileSchema);
	return mongoose.model('ObjectFile');
}
