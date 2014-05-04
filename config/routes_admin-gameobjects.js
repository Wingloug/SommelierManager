module.exports = function(app, models) {
	var mongoose = require("mongoose");
	var async = require("async");

	app.get("/admin_panel/gameobjects", function(req, res) {
		console.log("auth login");
		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];

		models.GameObject.find().populate("project").populate("parent").exec(function(err, game_objects) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("admin_game_objects", {title: "Administración - Proyectos", game_objects: [], active: 2 });
			}
			if (!game_objects) {
				res.render("admin_game_objects", {title: "Administración - Proyectos", game_objects: [], active: 2 });
			}
			else {
				res.render("admin_game_objects", {title: "Administración - Proyectos", game_objects: game_objects, active: 2 });
			}
		});
	});

	app.get("/admin_panel/gameobjects/new", function(req, res) {
		console.log("auth login");

		var projects = [];
		var users = [];
		var tasks = [];
		var parents = [];
		var errors = [];

		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
			name: "Game Objects",
			href:"/admin_panel/gameobjects/"
		});

		app.locals.crumbs.push({
			name: "Nuevo game object",
			href: "/admin_panel/gameobjects/new"
		});

		async.parallel({
			projects: function(callback) {
				models.Project.find().exec(function(err, response) {
					if (err) {
						console.log(err);
						callback(err);
					}
					if (!response) {
						callback("No se encontró ningún proyecto. Es necesario que exista uno previamente antes de crear un Game Object");
					}
					else {
						callback(null, response);
					}
				});
			},
			users: function(callback) {
				models.User.find().exec(function(err, response) {
					if (err) {
						console.log(err);
						callback(err);
					}
					if (!response) {
						callback(null, []);
					}
					else {
						callback(null, response);
					}
				});
			}
		}, function(err, results) {
			if (err) {
				req.flash("error", err);
			}
			else  {
				tasks.push("code");
				tasks.push("music");
				tasks.push("design");

				models.GameObject.find({ project: results.projects[0] }).exec(function(err, parents) {
					if (err) {
						console.log(err);
					}
					if (!parents) {
						res.render("game_object_form", { title: "Administración - Crear Nuevo Game Object", projects: results.projects, parents: [], users: results.users, tasks: tasks, game_object: {}, active: 2 });
					}
					else {
						res.render("game_object_form", { title: "Administración - Crear Nuevo Game Object", projects: results.projects, parents: parents, users: results.users, tasks: tasks, game_object: {}, active: 2 });
					}
				});
			}
		});
	});

	app.post("/admin_panel/gameobjects/new", function(req, res) {
		// name, description, parent, branch, project
		req.sanitize("name").trim();
		req.sanitize("description").trim();
		req.sanitize("parent");
		req.sanitize("branch").trim();
		req.sanitize("project");
		req.sanitize("user_id");

		var errors = [];
		var successes = [];

		var game_object = new models.GameObject();
		game_object.name = req.param("name");
		game_object.description = req.param("description");
		if (req.param("parent")) {
			game_object.parent = new mongoose.Types.ObjectId(req.param("parent"));
			var branch = [];
			if (req.param("branch")) {
				var temp = req.param("branch").split(" ");
				for (var i = 0; i < temp.length ; i++) {
					branch.push(new mongoose.Types.ObjectId(temp[i]));
				}
			}
			branch.push(game_object.parent);

			game_object.branch = branch;
		}
		game_object.project = new mongoose.Types.ObjectId(req.param("project"));

		game_object.save(function(err, nuevo) {
			if (err) {
				console.log(err);
				errors.push("No fue posible crear el objeto. Inténtelo nuevamente");
			}
			else {
				successes.push("Objeto creado correctamente");
				if (req.param("user_id")) {
					if (Array.isArray(req.param("user_id"))) {
						// Se castea a ObjectId
						var ids = [];
						for (var i = 0; i < req.param("user_id").length; i++) {
							ids.push(new mongoose.Types.ObjectId(req.param("user_id")[i]));
						}
						models.User.find().in("_id", ids).exec(function(err, users) {
							if (err) {
								console.log(err);
							}
							if (!users) {
								errors.push("El grupo de usuarios al que se le quiso asignar el Game Object no existe");
							}
							else {
								var board = new models.Board();
								board.save(function(err, nueva) {
									if (err) {
										console.log(err);
									}
									if (nueva) {
										console.log("board creado " + users.length);
										for (var i = 0; i < users.length; i++) {
											var user = users[i];
											var index = ids.indexOf(nuevo.id);
											var temp = {
												game_object : nuevo.id,
												task: req.param("user_task")[index],
												task_description : req.param("user_task_descr")[index],
												board: nueva.id
											}
											var objects = [];
											if (user.objects) {
												objects = user.objects;
											}
											objects.push(temp);
											user.objects = objects;
											user.save(function(err, updated) {
												if (err) {
													console.log(err);
												}
											});
										}
									}
								});
							}
						});
					}
					else {
						var id = new mongoose.Types.ObjectId(req.param("user_id"));
						models.User.findById(id).exec(function(err, user) {
							if (err) {
								console.log(err)
							}
							if (!user) {
								errors.push("El usuario al que se le quiso asignar el Game Object no existe");
							}
							else {
								var board = new models.Board();
								board.save(function(err, nueva) {
									if (err) {
										console.log(err);
									}
									if (nueva) {
										var temp = {
											game_object: nuevo.id,
											task: req.param("user_task"),
											task_description: req.param("user_task_descr"),
											board: nueva.id
										}
										var objects = [];
										if (user.objects) {
											objects = user.objects;
										}
										objects.push(temp);
										user.objects = objects;
										user.save(function(err, updated) {
											if (err) {
												console.log(err);
											}
										});
									}
								});
							}
						})
					}
				}
			}
			if (errors.length) {
				req.flash("error", errors);
			}
			if (successes.length) {
				req.flash("success", successes);
			}
			res.redirect("/admin_panel/gameobjects/new");
		});
	});

	app.get("/admin_panel/gameobjects/edit/:id", function(req, res) {
		req.sanitize("id");
		console.log("auth login");

		var projects = [];
		var users = [];
		var tasks = [];
		var parents = [];
		var errors = [];

		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
			name: "Game Objects",
			href:"/admin_panel/gameobjects/"
		});

		app.locals.crumbs.push({
			name: "Nuevo game object",
			href: "/admin_panel/gameobjects/new"
		});

		models.GameObject.findOne({ _id: req.param("id") }).exec(function(err, game_object) {
			if (err) {
				console.log(err);
				req.flash("error", "Se ha producido un error. Inténtelo nuevamente");
				return res.redirect("/admin_panel/gameobjects");
			}

			if (!game_object) {
				console.log("Game Object no encontrado");
				req.flash("error", "El game object no fue encontrado");
				res.redirect("/admin_panel/gameobjects");
			}
			else {
				async.parallel({
					projects: function(callback) {
						models.Project.find().exec(function(err, response) {
							if (err) {
								console.log(err);
								callback(err);
							}
							if (!response) {
								callback("No se encontró ningún proyecto. Es necesario que exista uno asociado al Game Object");
							}
							else {
								callback(null, response);
							}
						});
					},
					users: function(callback) {
						models.User.find().exec(function(err, response) {
							if (err) {
								console.log(err);
								callback(err);
							}
							if (!response) {
								callback(null, []);
							}
							else {
								callback(null, response);
							}
						});
					},
					assigned_users: function(callback) {
						models.User.find({ 'objects.game_object': req.param("id") }).exec(function(err, response) {
							if (err) {
								console.log(err);
								callback(err);
							}
							if (!response) {
								callback(null, []);
							}
							else {
								console.log('-------' + response.length);
								callback(null, response);
							}
						});
					}
				}, function(err, results) {
					if (err) {
						req.flash("error", err);
					}
					else  {
						tasks.push("code");
						tasks.push("music");
						tasks.push("design");

						models.GameObject.find({ project: game_object.project }).where('_id').ne(req.param("id")).exec(function(err, parents) {
							if (err) {
								console.log(err);
							}
							if (!parents) {
								res.render("game_object_form", { title: "Administración - Editar Game Object", projects: results.projects, parents: [], users: results.users, tasks: tasks,  assigned_users: results.assigned_users,game_object: game_object, active: 2 });
							}
							else {
								res.render("game_object_form", { title: "Administración - Editar Game Object", projects: results.projects, parents: parents, users: results.users, tasks: tasks, assigned_users: results.assigned_users, game_object: game_object, active: 2 });
							}
						});
					}
				});
			}
		});
	});

	app.post("/admin_panel/gameobjects/delete/:id", function(req, res) {

	});

	app.post("/game_objects", function(req, res) {
		// project_id
		req.sanitize("project_id"),
		models.GameObject.find({ project: req.param("project_id") }, "id name branch project").exec(function(err, game_objects) {
			if (err) {
				res.send(202, err);
			}
			if (!game_objects) {
				res.send(200, []);
			}
			else {
				var response = [];
				for (var i = 0; i < game_objects.length; i++) {
					response[i] = {
						id: game_objects[i].id,
						name: game_objects[i].name,
						project: game_objects[i].project,
						branch: ""
					}

					if (game_objects[i].branch) {
						var branch = "";

						for (var j = 0; j < game_objects[i].branch.length; j++) {
							branch += game_objects[i].branch[j].toString() + " ";
						}
						response[i].branch = branch;
					}
				}
				res.send(200, response);
			}
		})
	});
}
