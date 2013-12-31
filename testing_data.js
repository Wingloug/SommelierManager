models.User.create({
	username: "testing_user",
	password: "",
	name: "Daniela",
	last_name: "Muñoz",
	role: "admin"
}).success(function(user) {
	models.Project.bulkCreate([
		{ name: "Mess", created_by: user.id },
		{ name: "Tupifarmer", created_by: user.id},
		{ name: "Bipolar", created_by: user.id }
	]).success(function() {
		console.log("projects created");
		models.UserProject.bulkCreate([
			{ project_id: 1, user_id: user.id },
			{ project_id: 2, user_id: user.id },
			{ project_id: 3, user_id: user.id }
		]).success(function() {
			console.log("project associated to user");
		});
	});
});

models.GameObject.bulkCreate([
	{
		name: "Nivel 1" ,
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis iaculis arcu. In elementum cursus tellus quis gravida. ",
		parent_id: null,
		project_id: 1,
		branch: ""
	},
	{
		name: "Nivel 2",
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis iaculis arcu. In elementum cursus tellus quis gravida. ",
		parent_id: null,
		project_id: 1,
		branch: ""
	}
]).success(function() {
	models.GameObject.find({
		where: {
			name: "Nivel 1"
		}
	}).success(function(object) {
		models.GameObject.bulkCreate([
			{
				name: "Túnel",
				description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis iaculis arcu. In elementum cursus tellus quis gravida. ",
				parent_id: object.id,
				project_id: 1,
				branch: "" + object.id
			},
			{
				name: "Topo",
				description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis iaculis arcu. In elementum cursus tellus quis gravida. ",
				parent_id: object.id,
				project_id: 1,
				branch: "" + object.id
			},
			{
				name: "Puerta",
				description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis iaculis arcu. In elementum cursus tellus quis gravida. ",
				parent_id: object.id,
				project_id: 1,
				branch: "" + object.id
			}
		]).success(function() {
			models.GameObject.find({
				where: {
					name: "Puerta"
				}
			}).success(function(object) {
				models.GameObject.bulkCreate([
					{
						name: "Botones",
						description: "",
						parent_id: object.id,
						project_id: 1,
						branch: object.branch + "," + object.id
					},
					{
						name: "Textura",
						description: "",
						parent_id: object.id,
						project_id: 1,
						branch: object.branch + "," + object.id
					}
				]).success(function() {

				});
			});
		});
	});
});

models.UserObject.bulkCreate([
	{ user_id: 1, game_object_id: 1, project_id: 1, role: "programador"},
	{ user_id: 1, game_object_id: 2, project_id: 1, role: "programador"},
	{ user_id: 1, game_object_id: 3, project_id: 1, role: "programador"},
	{ user_id: 1, game_object_id: 4, project_id: 1, role: "programador"},
]).success(function() {

});

// Files - Assets
models.ObjectFile.saveRecord({
	original_filename: "background.png",
	path: "/project_files/Mess/Nivel 1/",
	type: "image",
	description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dictum magna sit amet orci gravida laoreet ut ac nibh.",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "hoja.jpg",
	path: "/project_files/Mess/Nivel 1/",
	type: "image",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "mercurio.jpg",
	path: "/project_files/Mess/Nivel 1/",
	type: "image",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "invierno.jpg",
	path: "/project_files/Mess/Nivel 1/",
	type: "image",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "hoja2.jpg",
	path: "/project_files/Mess/Nivel 1/",
	type: "image",
	description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dictum magna sit amet orci gravida laoreet ut ac nibh.",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "piano.mp3",
	path: "/project_files/Mess/Nivel 1/",
	type: "audio",
	description: "",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "clone_wars.mp4",
	path: "/project_files/Mess/Nivel 1/",
	type: "video",
	description: "Star.Wars.The.Clone.Wars.S05E15.HDTV.x264-2HD",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "change_your_mind.mp3",
	path: "/project_files/Mess/Nivel 1/",
	type: "audio",
	description: "",
	game_object_id: 1,
	uploaded_by: 1
});

models.ObjectFile.saveRecord({
	original_filename: "proposal.docx",
	path: "/project_files/Mess/Nivel 1/",
	type: "text",
	description: "Game proposal",
	game_object_id: 1,
	uploaded_by: 1
});

// Todos los objetos asociados al usuario 1
models.UserObject.findAll({
	where: {
		user_id: 1
	}
}).success(function(res) {
	// Crear boards
	for (var i = 0; i < res.length; i++) {
		models.Board.create({
			user_object_id: res[i].id
		}).success(function(board) {
			// //  Crear items
			// models.BoardItem.bulkCreate([
			// 	{
			// 		board_id: board.id,
			// 		description: "Cambiar estado de los items para board " + board.id.toString(),
			// 	},
			// 	{
			// 		board_id: board.id,
			// 		description: "Agregar labels a los items para board " + board.id.toString(),
			// 	},
			// 	{
			// 		board_id: board.id,
			// 		container: "doing",
			// 		description: "Ejemplo de item 'doing' " + board.id.toString(),
			// 	},
			// 	{
			// 		board_id: board.id,
			// 		container: "done",
			// 		description: "Ejemplo de item completado "  + board.id.toString(),
			// 	}
			// ]).success(function() {

			// });
		});
	}
});

// // Actualizar items_count
// models.Board.update({ items_count: 4},  { id: 1 }).success(function() {
// });
// models.Board.update({ completed_count: 1},  { id: 1 }).success(function() {
// });
// models.Board.update({ items_count: 4},  { id: 2 }).success(function() {
// });
// models.Board.update({ completed_count: 1},  { id: 2 }).success(function() {
// });
// models.Board.update({ items_count: 4},  { id: 3 }).success(function() {
// });
// models.Board.update({ completed_count: 1},  { id: 3 }).success(function() {
// });
// models.Board.update({ items_count: 4},  { id: 4 }).success(function() {
// });
// models.Board.update({ completed_count: 1},  { id: 4 }).success(function() {
// });

// // Actualizar progreso user_object
// models.Board.findAll().success(function(boards) {
// 	for (var i = 0; i < boards.length; i++) {
// 		var progress = boards[i].completed_count*100/boards[i].items_count;
// 		models.UserObject.update({ progress: progress }, { id: boards[i].user_object_id }).success(function(){
// 		});
// 	}
// });
