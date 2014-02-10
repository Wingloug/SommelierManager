module.exports = function(mongoose) {
	var Schema = mongoose.Schema;

	var BoardSchema = new Schema({
		items_count: {
			type: Number,
			min: 0
		},
		completed_count: {
			type: Number,
			min: 0
		},
		todo_items: [{
			description: {
				type: String,
				default: "",
				trim: true
			},
			label: {
				type: String,
				enum: ["default", "info", "success", "warning", "danger"],
				default: "default"
			}
		}],
		doing_items: [{
			description: {
				type: String,
				default: "",
				trim: true
			},
			label: {
				type: String,
				enum: ["default", "info", "success", "warning", "danger"],
				default: "default"
			}
		}],
		done_items: [{
			description: {
				type: String,
				default: "",
				trim: true
			},
			label: {
				type: String,
				enum: ["default", "info", "success", "warning", "danger"],
				default: "default"
			}
		}]
	}, { collection: "boards" });

	mongoose.model('Board', BoardSchema);
	return mongoose.model('Board');
}
