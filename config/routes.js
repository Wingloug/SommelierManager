module.exports = function(app, models) {
	var mongoose = require("mongoose");
	var async = require("async");
	/*
	  * models: { User, Project, GameObject, UserProject, UserObject, ObjectFile }
	  */

	  app.get("/", function(req, res) {
	  	res.render("home", { title: "Prototipo - Home" , crumbs: [], children: []});
	  });

	// Projects
	app.get("/projects", function(req, res) {
		var crumbs = [];
		// root
		crumbs[0] = {
			id: -1,
			name: "Projects",
			href: "/projects"
		}

		models.User.findById(app.locals.user.id).populate("projects").exec(function(err, user) {
			if (err || !user) {
				res.render('projects', { title: "Prototipo - Projects", crumbs: crumbs, children: [], projects: [], user: app.locals.user, flash: req.flash()});
			}

			res.render('projects', { title: "Prototipo - Projects", crumbs: crumbs, children: [], projects: user.projects, user: app.locals.user, flash: req.flash()});
		});
	});

	app.post("/children", function(req, res) {
		var id = req.param("parent");
		var children = [];

		models.GameObject.find({ parent: id }).exec(function(err, objects) {
			if (err || !objects) {
				res.send(202, []);
			}
			else {
				for (var i = 0; i < objects.length; i++ ) {
					children[i] = {
						id : objects[i].id.toString(),
						name: objects[i].name,
					}
				}
				res.send(200, children);
			}
		});
	});


	app.get("/projects/:project_name", function(req, res) {
		req.sanitize("project_name");
		var project_name = req.param("project_name");
		var crumbs = [];
		var children = [];

		crumbs[0] = {
			id: -1,
			name: "Projects",
			href: "/projects"
		}

		models.Project.findOne({ name: project_name }).exec(function(err, project) {
			if (err) {
				req.flash("error", "Ocurrió un error inesperado. Inténte nuevamente.");
				res.redirect("/projects");
			}
			if (!project) {
				req.flash("error", "Proyecto no encontrado");
				res.redirect("/projects");
			}
			else {
				crumbs[1] = {
					id: project.id,
					name: project_name,
					href: "/projects/" + project.name
				}
				// Comparar permiso de acceso del usuario logeado al proyecto
				if (app.locals.user.projects.indexOf(project.id) != -1) {
					// Se obtienen los hijos directos del proyecto (objetos sin padre)
					models.GameObject.find({ project: project.id }).exists("parent", false).exec(function(err, game_objects) {
						if (err) {
							console.log(err);
							req.flash("error", "Ocurrió un error inesperado. Inténte nuevamente.");
							res.redirect("/projects");
						}
						if (!game_objects) {
							req.flash("info", "El proyecto no tiene objetos asociados");
							res.render('objects_tree', { title: 'Prototipo - Project Objects', path: "/projects/" + project_name + "/",  crumbs: crumbs, children: children, objects: [], user: app.locals.user, flash: req.flash() });
						}
						else {
							for (var i = 0; i < game_objects.length; i++) {
								children[i] = {
									id: game_objects[i].id,
									name: game_objects[i].name,
									href: "/projects/" + project.name + "/panel/" + game_objects[i].id
								}
							}
							res.render('objects_tree', { title: 'Prototipo - Project Objects', path: "/projects/" + project_name + "/",  crumbs: crumbs, children: children, objects: game_objects, user: app.locals.user, flash: req.flash()});
						}
					});
				}
				else {
					req.flash("error", "No tiene acceso al proyecto " + project.name);
					res.redirect("/projects");
				}
			}
		})
	});

	app.get("/projects/:project_name/panel/:object_id", function(req, res) {
		req.sanitize("project_name");
		req.sanitize("object_id");

		var project_name = req.param("project_name");
		var game_object_files = [];
		var children = [];
		var crumbs = [];
		var extra = {};
		var todo= [];
		var doing = [];
		var done = [];

		crumbs.push({
			id: -1,
			name: "Projects",
			href: "/projects"
		});

		models.GameObject.findById(req.param("object_id")).populate('files').exec(function(err, game_object) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.redirect("/project/" + project_name);
			}

			if (!game_object) {
				req.flash("error", "El objeto no existe");
				res.redirect("/project/" + project_name);
			}
			else {
				// Comprobar que el usuario logeado tiene acceso al objeto (proyecto)
				if (app.locals.user.projects.indexOf(game_object.project) != -1) {
					game_object_files = game_object.files;

					var branch = game_object.branch;

					var response = {
						id: game_object.id,
						name: game_object.name,
						description: game_object.description
					}

					crumbs.push({
						id: game_object.project,
						name: project_name,
						href: "/projects/" + project_name
					});

					// Se completan los breadcrumbs
					if (branch.length) {
						models.GameObject.find().in("_id", branch).exec(function(err, game_objects) {
							if (err) {
								console.log(err);
							}

							if (!game_objects) {
								crumbs.push({
									id: response.id,
									name: response.name,
									href: "/projects/" + project_name + "/panel/" + response.id
								});
							}
							else {
								for (var i = 0; i < game_objects.length; i++) {
									crumbs.push({
										id: game_objects[i].id,
										name: game_objects[i].name,
										href: "/projects/" + project_name + "/panel/" + game_objects[i].id
									});
								}

								crumbs.push({
									id: response.id,
									name: response.name,
									href: "/projects/" + project_name + "/panel/" + response.id
								});
							}
						});
					}
					else {
						crumbs.push({
							id: response.id,
							name: response.name,
							href: "/projects/" + project_name + "/panel/" + response.id
						});
					}

					// Se obtienen los hijos directos del objeto (breadcrumbs)
					models.GameObject.find({ parent: game_object.id }).exec(function(err, game_objects) {
						if (err) {
							console.log(err);
						}

						if (game_objects) {
							for (var i = 0; i < game_objects.length; i++) {
								children.push({
									id: game_objects[i].id,
									name: game_objects[i].name,
									href: "/projects/" + project_name + "/panel/" + game_objects[i].id
								});
							}
						}


						//  Se verifica si es que el usuario tiene el objeto asignado => información especial + archivos + todo panel
						if (app.locals.user.objects.length) {
							for (var i = 0; i < app.locals.user.objects.length; i++) {
								if (app.locals.user.objects[i].game_object == game_object.id) {
									extra.task = app.locals.user.objects[i].task;
									extra.task_description = app.locals.user.objects[i].task_description;
									extra.progress = app.locals.user.objects[i].progress;
									extra.board_id = app.locals.user.objects[i].board;
									break;
								}
							}

							if (extra.board_id) {
								// Se obtiene el board correspondiente
								models.Board.findById(extra.board_id).exec(function(err, board) {
									if (err) {
										console.log(err);
									}
									if (!board) {
										// Crear un board nuevo y asociarlo al usuario
										var nuevo_board = new models.Board();
										nuevo_board.save(function(err, nuevo) {
											if (err) {
												console.log(err);
											}
											if (nuevo) {
												for (var i = 0; i < app.locals.user.objects.length; i++) {
													if (app.locals.user.objects[i].game_object === game_object.id) {
														app.locals.user.objects[i].board = nuevo.id;
														break;
													}
												}
												res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: game_object_files, extra: extra, todo: [], doing: [], done: [], flash: req.flash() });
											}
										});
									}
									else {
										todo = (board.todo_items.length ? board.todo_items: []);
										doing = (board.doing_items.length ? board.doing_items : []);
										done = (board.done_items.length ? board.done_items : []);
										res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: game_object_files, extra: extra, todo: todo, doing: doing, done: done, flash: req.flash() });
									}
								});
							}
							else {
								console.log(children);
								// Usuario con acceso readonly (no tiene asignado el objeto)
								req.flash("info", "Acceso sólo de lectura");
								res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: game_object_files, extra: {}, todo: [], doing: [], done: [], flash: req.flash() });
							}
						}
						else {
							// Usuario con acceso readonly (no tiene asignado el objeto)
								req.flash("info", "Acceso sólo de lectura");
								res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: game_game_object_files, extra: {}, todo: [], doing: [], done: [], flash: req.flash() });
						}
					});
				}
				else {
					// El usuario no tiene acceso al objeto (proyecto)
					req.flash("error", "No tiene acceso al proyecto");
					res.redirect("/projects");
				}
			}
		});
	});

	app.get("/download", function(req, res) {
		// ?path=/project_files/project/filename&filename=original_filename
		var path = req.query.path;
		var filename = req.query.filename;
		res.download(app.root + "/public" + path, filename, function(err) {
			if(err) {
				res.send(404, "Archivo no encontrado");
			}
		});
	});

	app.post("/create_update_item", function(req, res) {
		// id, board_id, container, description, label
		var item = req.body;
		var original = {}
		if (item.id) {
			// Actualizar item
			// models.BoardItem.find(req.body.id).success(function(item_original) {
			// 	original = item_original;
			// 	// Si el item ahora es marcado como "done", incrementar completed_count de Board
			// 	if ((item.container === "done") && (item.container !== original.container)){
			// 		// Actualizar item
			// 		models.BoardItem.update({
			// 			container: item.container,
			// 			description: item.description,
			// 			label: item.label
			// 		}, {
			// 			id: item.id
			// 		}).success(function() {
			// 			// Incrementar completed_count
			// 			models.Board.find(original.board_id).success(function(board) {
			// 				board.increment("completed_count", 1).success(function(board) {
			// 					board.reload().success(function() {
			// 						// Actualizar progress de UserObject
			// 						var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
			// 						progress = Number(progress.toFixed(1));
			// 						models.UserObject.find(board.user_object_id).success(function(user_object) {
			// 							user_object.updateAttributes({ progress: progress }).success(function() {
			// 								console.log("Progreso de UserObject actualizado " + progress);
			// 								// Actualizar progress de Project
			// 								models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
			// 									// progreso promedio
			// 									var prom = 0;
			// 									for (var i = 0; i < user_objects.length; i++) {
			// 										prom += user_objects[i].progress;
			// 									}

			// 									prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
			// 									prom = Number(prom.toFixed(1));
			// 									models.Project.find(user_object.project_id).success(function(project) {
			// 										project.updateAttributes({ progress: prom }).success(function() {
			// 											console.log("Progreso Project actualizado " + prom);
			// 											res.send(200, item);
			// 										}).error(function(err) {
			// 											console.log(err);
			// 											res.send(500, err);
			// 										});
			// 									}).error(function(err) {
			// 										console.log(err);
			// 										res.send(500, err);
			// 									});
			// 								}).error(function(err) {
			// 									console.log(err);
			// 									res.send(500, err);
			// 								});
			// 							}).error(function(err) {
			// 								console.log(err);
			// 								res.send(500, err);
			// 							});
			// 						}).error(function(err) {
			// 							console.log(err);
			// 							res.send(500, err);
			// 						});
			// 					}).error(function(err) {
			// 						console.log(err);
			// 						res.send(500, err);
			// 					});
			// 				}).error(function(err) {
			// 					console.log(err);
			// 					res.send(500, err);
			// 				});
			// 			})
			// 		}).error(function(err) {
			// 			console.log(err);
			// 			res.send(500, err);
			// 		});
			// 	}
			// 	// Si el item antes estaba marcado como "done", decrementar completed_count de Board
			// 	else if ((original.container === "done") && (item.container !== original.container)) {
			// 		// Actualizar item
			// 		models.BoardItem.update({
			// 			container: item.container,
			// 			description: item.description,
			// 			label: item.label
			// 		}, {
			// 			id: item.id
			// 		}).success(function() {
			// 			// Incrementar completed_count
			// 			models.Board.find(original.board_id).success(function(board) {
			// 				board.decrement("completed_count", 1).success(function(board) {
			// 					board.reload().success(function() {
			// 						// Actualizar progress de UserObject
			// 						var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
			// 						progress = Number(progress.toFixed(1));
			// 						models.UserObject.find(board.user_object_id).success(function(user_object) {
			// 							user_object.updateAttributes({ progress: progress }).success(function() {
			// 								console.log("Progreso de UserObject actualizado " + progress);
			// 								// Actualizar progress de Project
			// 								models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
			// 									// progreso promedio
			// 									var prom = 0;
			// 									for (var i = 0; i < user_objects.length; i++) {
			// 										prom += user_objects[i].progress;
			// 									}

			// 									prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
			// 									prom = Number(prom.toFixed(1));
			// 									models.Project.find(user_object.project_id).success(function(project) {
			// 										project.updateAttributes({ progress: prom }).success(function() {
			// 											console.log("Progreso Project actualizado " + prom);
			// 											res.send(200, item);
			// 										}).error(function(err) {
			// 											console.log(err);
			// 											res.send(500, err);
			// 										});
			// 									}).error(function(err) {
			// 										console.log(err);
			// 										res.send(500, err);
			// 									});
			// 								}).error(function(err) {
			// 									console.log(err);
			// 									res.send(500, err);
			// 								});
			// 							}).error(function(err) {
			// 								console.log(err);
			// 								res.send(500, err);
			// 							});
			// 						}).error(function(err) {
			// 							console.log(err);
			// 							res.send(500, err);
			// 						});
			// 					}).error(function(err) {
			// 						console.log(err);
			// 						res.send(500, err);
			// 					});
			// 				}).error(function(err) {
			// 					console.log(err);
			// 					res.send(500, err);
			// 				});
			// 			})
			// 		}).error(function(err) {
			// 			console.log(err);
			// 			res.send(500, err);
			// 		});
			// 	}
			// 	// Actualizar items
			// 	else {
			// 		// Actualizar item
			// 		models.BoardItem.update({
			// 			container: item.container,
			// 			description: item.description,
			// 			label: item.label
			// 		}, {
			// 			id: item.id
			// 		}).success(function() {
			// 			res.send(200, item);
			// 		}).error(function(err) {
			// 			console.log(err);
			// 			res.send(500, err);
			// 		});
			// 	}
			// }).error(function(err) {
			// 	console.log(err);
			// 	res.send(202, err);
			// });
		}
		// Crear item
		else {
			// models.BoardItem.saveRecord({
			// 	board_id: item.board_id,
			// 	container: item.container,
			// 	description: item.description,
			// 	label: (item.label ? item.label : "")
			// }, function(nuevo, err) {
			// 	if (err) {
			// 		console.log(err);
			// 		res.send(400, err);
			// 	}
			// 	else {
			// 		if (nuevo.container === "done") {
			// 			// Actualizar completed_count de Board
			// 			models.Board.find(nuevo.board_id).success(function(board) {
			// 				board.increment(["items_count", "completed_count"], 1).success(function(board) {
			// 					// Actualizar progress de UserObject
			// 					board.reload().success(function() {
			// 						var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
			// 						progress = Number(progress.toFixed(1));
			// 						models.UserObject.find(board.user_object_id).success(function(user_object) {
			// 							user_object.updateAttributes({ progress: progress }).success(function() {
			// 								console.log("Progreso de UserObject actualizado " + progress);
			// 								// Actualizar progress de Project
			// 								models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
			// 									// progreso promedio
			// 									var prom = 0;
			// 									for (var i = 0; i < user_objects.length; i++) {
			// 										prom += user_objects[i].progress;
			// 									}

			// 									prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
			// 									prom = Number(prom.toFixed(1));
			// 									models.Project.find(user_object.project_id).success(function(project) {
			// 										project.updateAttributes({ progress: prom }).success(function() {
			// 											console.log("Progreso Project actualizado " + prom);
			// 											res.send(200, nuevo);
			// 										}).error(function(err) {
			// 											console.log(err);
			// 											res.send(500, err);
			// 										});
			// 									}).error(function(err) {
			// 										console.log(err);
			// 										res.send(500, err);
			// 									});
			// 								}).error(function(err) {
			// 									console.log(err);
			// 									res.send(500, err);
			// 								});
			// 							}).error(function(err) {
			// 								console.log(err);
			// 								res.send(500, err);
			// 							});
			// 						}).error(function(err) {
			// 							console.log(err);
			// 							res.send(500, err);
			// 						});
			// 					});
			// 				}).error(function(err) {
			// 					console.log(err);
			// 					res.send(500, err);
			// 				});
			// 			}).error(function(err) {
			// 				console.log(err);
			// 				res.send(500, err);
			// 			});
			// 		}
			// 		else {
			// 			// Actualizar items_count de Board
			// 			models.Board.find(nuevo.board_id).success(function(board) {
			// 				board.increment("items_count", 1).success(function(board) {
			// 					// Actualizar progress de UserObject
			// 					board.reload().success(function() {
			// 						var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
			// 						progress = Number(progress.toFixed(1));
			// 						models.UserObject.find(board.user_object_id).success(function(user_object) {
			// 							user_object.updateAttributes({ progress: progress }).success(function() {
			// 								console.log("Progreso de UserObject actualizado " + progress);
			// 								// Actualizar progress de Project
			// 								models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
			// 									// progreso promedio
			// 									var prom = 0;
			// 									for (var i = 0; i < user_objects.length; i++) {
			// 										prom += user_objects[i].progress;
			// 									}

			// 									prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
			// 									prom = Number(prom.toFixed(1));
			// 									models.Project.find(user_object.project_id).success(function(project) {
			// 										project.updateAttributes({ progress: prom }).success(function() {
			// 											console.log("Progreso Project actualizado " + prom);
			// 											res.send(200, nuevo);
			// 										}).error(function(err) {
			// 											console.log(err);
			// 											res.send(500, err);
			// 										});
			// 									}).error(function(err) {
			// 										console.log(err);
			// 										res.send(500, err);
			// 									});
			// 								}).error(function(err) {
			// 									console.log(err);
			// 									res.send(500, err);
			// 								});
			// 							}).error(function(err) {
			// 								console.log(err);
			// 							});
			// 						});
			// 					});
			// 				}).error(function(err) {
			// 					res.send(500, err);
			// 				});
			// 			}).error(function(err) {
			// 				res.send(500, err);
			// 			})
			// 		}
			// 	}
			// });
		}
	});

	app.post("/delete_item", function(req, res) {
		// id
		if (req.body.id) {
			var board_item = {};
			// models.BoardItem.find(req.body.id).success(function(item) {
			// 	// Actualizar items_count de Board
			// 	board_item = item;
			// 	if (board_item.container === "done") {
			// 		// Actualizar completed_count de Board
			// 		models.Board.find(item.board_id).success(function(board) {
			// 			board.decrement(["items_count", "completed_count"], 1).success(function(board) {
			// 				// Actualizar progress de UserObject
			// 				board.reload().success(function() {
			// 					var progress = ( board.items_count ? board.completed_count * 100/ board.items_count : 0);
			// 					progress = Number(progress.toFixed(1));
			// 					models.UserObject.find(board.user_object_id).success(function(user_object) {
			// 						user_object.updateAttributes({ progress: progress }).success(function() {
			// 							console.log("Progreso de UserObject actualizado " + progress);
			// 							// Actualizar progress de Project
			// 							models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
			// 								// progreso promedio
			// 								var prom = 0;
			// 								for (var i = 0; i < user_objects.length; i++) {
			// 									prom += user_objects[i].progress;
			// 								}

			// 								prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
			// 								prom = Number(prom.toFixed(1));
			// 								models.Project.find(user_object.project_id).success(function(project) {
			// 									project.updateAttributes({ progress: prom }).success(function() {
			// 										console.log("Progreso Project actualizado " + prom);
			// 										// Destroy
			// 										board_item.destroy().success(function() {
			// 											res.send(200, "destroyed");
			// 										}).error(function(err) {
			// 											res.send(500, err);
			// 										});
			// 									}).error(function(err) {
			// 										console.log(err);
			// 										res.send(500, err);
			// 									});
			// 								}).error(function(err) {
			// 									console.log(err);
			// 									res.send(500, err);
			// 								});
			// 							}).error(function(err) {
			// 								console.log(err);
			// 								res.send(500, err);
			// 							});
			// 						}).error(function(err) {
			// 							console.log(err);
			// 							res.send(500, err);
			// 						});
			// 					}).error(function(err) {
			// 						console.log(err);
			// 						res.send(500, err);
			// 					});
			// 				}).error(function(err) {
			// 					console.log(err);
			// 					res.send(500, err);
			// 				});
			// 			}).error(function(err) {
			// 				console.log(err);
			// 				res.send(500, err);
			// 			});
			// 		}).error(function(err){
			// 			console.log(err);
			// 			res.send(500, err);
			// 		});
			// 	}
			// 	else {
			// 		models.Board.find(item.board_id).success(function(board) {
			// 			board.decrement("items_count", 1).success(function(board) {
			// 				// Actualizar progress de UserObject
			// 				board.reload().success(function() {
			// 					var progress = ( board.items_count ? board.completed_count * 100/ board.items_count : 0);
			// 					models.UserObject.find(board.user_object_id).success(function(user_object) {
			// 						user_object.updateAttributes({ progress: progress }).success(function() {
			// 							console.log("Progreso de UserObject actualizado " + progress);
			// 							// Actualizar progress de Project
			// 							models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
			// 								// progreso promedio
			// 								var prom = 0;
			// 								for (var i = 0; i < user_objects.length; i++) {
			// 									prom += user_objects[i].progress;
			// 								}

			// 								prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
			// 								prom = Number(prom.toFixed(1));
			// 								models.Project.find(user_object.project_id).success(function(project) {
			// 									project.updateAttributes({ progress: prom }).success(function() {
			// 										console.log("Progreso Project actualizado " + prom);
			// 										// Destroy
			// 										board_item.destroy().success(function() {
			// 											res.send(200, "destroyed");
			// 										}).error(function(err) {
			// 											res.send(500, err);
			// 										});
			// 									}).error(function(err) {
			// 										console.log(err);
			// 										res.send(500, err);
			// 									});
			// 								}).error(function(err) {
			// 									console.log(err);
			// 									res.send(500, err);
			// 								});
			// 							}).error(function(err) {
			// 								console.log(err);
			// 								res.send(500, err);
			// 							});
			// 						}).error(function(err) {
			// 							console.log(err);
			// 							res.send(500, err);
			// 						});
			// 					}).error(function(err) {
			// 						console.log(err);
			// 						res.send(500, err);
			// 					});
			// 				}).error(function(err){
			// 					console.log(err);
			// 					res.send(500, err);
			// 				});
			// 			}).error(function(err) {
			// 				console.log(err);
			// 				res.send(500, err);
			// 			});
			// 		}).error(function(err) {
			// 			console.log(err);
			// 			res.send(500, err);
			// 		});
			// 	}
			// }).error(function(err) {
			// 	res.send(400, err);
			// });
		}
		else {
			res.send(400);
		}
	});

	app.get("/admin_panel", function(req, res) {
		console.log("auth login");
		res.render("admin", {title: "Administración", active: 0});
	});

	app.get("/admin_panel/users", function(req, res) {
		console.log("auth login");
		var users = [];
		models.User.find().exec(function(err, users) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("admin_users", {title: "Administración - Usuarios", users: [], flash: req.flash(), active: 1 });
			}
			if (!users) {
				res.render("admin_users", {title: "Administración - Usuarios", users: [], flash: req.flash(), active: 1 });
			}
			else {
				res.render("admin_users", {title: "Administración - Usuarios", users: users, flash: req.flash(), active: 1 });
			}
		});
	});

	app.get("/admin_panel/users/new", function(req, res) {
		console.log("auth login");
		var roles = [];
		roles[0] = "Administrador";
		roles[1] = "Usuario";

		var crumbs = []
		crumbs[0] = {
			name: "Administración",
			href: "/admin_panel"
		}

		crumbs[1] = {
			name: "Usuarios",
			href:"/admin_panel/users/"
		}

		crumbs[2] = {
			name: "Nuevo usuario",
			href: "/admin_panel/users/new"
		}

		models.Project.find().exec(function(err, projects) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("user_form", { title: "Administración - Crear Nuevo Usuario", crumbs: crumbs, children: [], user: {}, projects: [], roles: roles, flash: req.flash(), active: 1 });
			}
			if (!projects) {
				res.render("user_form", { title: "Administración - Crear Nuevo Usuario", crumbs: crumbs, children: [], user: {}, projects: [], roles: roles, flash: req.flash(), active: 1 });
			}
			else {
				res.render("user_form", { title: "Administración - Crear Nuevo Usuario", crumbs: crumbs, children: [], user: {}, projects: projects, roles: roles, flash: req.flash(), active: 1 });
			}
		});
	});

	app.post("/admin_panel/users/new", function(req, res) {
		// username, password, password_repeat, email, name, last_name, rol
		req.sanitize("username").trim();
		req.sanitize("password");
		req.sanitize("password_repeat");
		req.sanitize("email");
		req.sanitize("name").trim();
		req.sanitize("last_name").trim();
		req.sanitize("roles").toInt();

		req.assert("password", "La contraseña y su confimación no coinciden").equals(req.param("password_repeat"));

		if (req.param("email")) {
			req.assert("email", "Email no válido").isEmail();
		}

		var errors = [];
		var temp = req.validationErrors();
		if (temp) {
			for (var i = 0; i < temp.length; i++) {
				errors.push(temp[i].msg)
			}
		}

		check_username(req.body.username, function(disponible) {
			if (!disponible) {
				errors.push("Nombre de usuario no disponible");
			}

			if (!errors.length) {
				var user = new models.User();
				user.username = req.param("username");
				user.password = req.param("password");
				user.email = req.param("email");
				user.name = req.param("name");
				user.last_name = req.param("last_name");
				user.rol = req.param("rol");

				if (req.param("projects")) {
					if (Array.isArray(req.param("projects"))) {
						var projects = [];
						for (var i = 0; i < req.param("projects").length; i++) {
							var id = new mongoose.Types.ObjectId(req.param("projects")[i]);
							projects.push(id);
						}
						user.projects = projects;
					}
					else {
						var id = new mongoose.Types.ObjectId(req.param("projects"));
						var projects = [];
						projects.push(id);
						user.projects = projects;
					}
				}

				user.save(function(err, user) {
					if (err) {
						console.log(err);
						req.flash("error", err);
						req.flash("error", "No fue posible crear el usuario. Inténtelo nuevamente");
					}
					else {
						req.flash("success", "Usuario creado correctamente");
					}

					res.redirect("/admin_panel/users/new");
				});
			}
			else {
				req.flash("error", errors);

				var roles = [];
				roles[0] = "Administrador";
				roles[1] = "Usuario";

				var crumbs = []
				crumbs[0] = {
					name: "Administración",
					href: "/admin_panel"
				}

				crumbs[1] = {
					name: "Usuarios",
					href:"/admin_panel/users/"
				}

				crumbs[2] = {
					name: "Nuevo usuario",
					href: "/admin_panel/users/new"
				}

				var user = {};
				user.username = req.param("username");
				user.password = "";
				user.email = req.param("email");
				user.name = req.param("name");
				user.last_name = req.param("last_name");
				user.rol = req.param("rol");

				models.Project.find().exec(function(err, projects) {
					if (err) {
						console.log(err);
						req.flash("error", err);
						res.render("user_form", { title: "Administración - Crear Nuevo Usuario", crumbs: crumbs, children: [], flag: "new", user: user, projects: [], roles: roles, flash: req.flash(), active: 1 });
					}
					if (!projects) {
						res.render("user_form", { title: "Administración - Crear Nuevo Usuario", crumbs: crumbs, children: [], flag: "new", user: user, projects: [], roles: roles, flash: req.flash(), active: 1 });
					}
					else {
						res.render("user_form", { title: "Administración - Crear Nuevo Usuario", crumbs: crumbs, children: [], flag: "new", user: user, projects: projects, roles: roles, flash: req.flash(), active: 1 });
					}
				});
			}
		});
	});

	app.get("/admin_panel/projects", function(req, res) {
		console.log("auth login");
		models.Project.find().populate("created_by").exec(function(err, projects) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("admin_projects", {title: "Administración - Proyectos", projects: [], flash: req.flash(), active: 2 });
			}
			if (!projects) {
				res.render("admin_projects", {title: "Administración - Proyectos", projects: [], flash: req.flash(), active: 2 });
			}
			else {
				res.render("admin_projects", {title: "Administración - Proyectos", projects: projects, flash: req.flash(), active: 2 });
			}
		});
	});

	app.get("/admin_panel/projects/new", function(req, res) {
		console.log("auth login");
		var statuses = [];
		statuses[0] = "Activo";
		statuses[1] = "Pausado";
		statuses[2] = "Completado";

		var crumbs = []
		crumbs[0] = {
			name: "Administración",
			href: "/admin_panel"
		}

		crumbs[1] = {
			name: "Proyectos",
			href:"/admin_panel/projects/"
		}

		crumbs[2] = {
			name: "Nuevo proyecto",
			href: "/admin_panel/projects/new"
		}

		models.User.find().exec(function(err, users) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("project_form", { title: "Administración - Crear Nuevo Proyecto", users: [], crumbs: crumbs, children: [], project: {}, statuses: statuses, flash: req.flash(), active: 2 });
			}
			if (!users) {
				res.render("project_form", { title: "Administración - Crear Nuevo Proyecto", users: [], crumbs: crumbs, children: [], project: {}, statuses: statuses, flash: req.flash(), active: 2 });
			}
			else {
				res.render("project_form", { title: "Administración - Crear Nuevo Proyecto", users: users, crumbs: crumbs, children: [], project: {}, statuses: statuses, flash: req.flash(), active: 2 });
			}
		});
	});

	app.post("/admin_panel/projects/new", function(req, res) {
		// name, progress, status, users
		req.sanitize("name").trim();
		req.sanitize("progress").toInt();
		req.sanitize("status").toInt();
		req.sanitize("users");

		var project = new models.Project();
		project.name = req.param("name");
		project.status = req.param("status");
		project.created_by = new mongoose.Types.ObjectId("52f84ef58f6a11cf3a28473d");

		project.save(function(err, nuevo) {
			if (err) {
				console.log(err);
				req.flash("error", "No fue posible crear el proyecto. Inténtelo nuevamente");
			}
			else {
				// Se otorga acceso al proyecto para el usuario que lo acaba de crear
				if (req.param("users").length >= 1) {
					if (Array.isArray(req.param("users"))) {
						for (var i = 0; i < req.param("users").length; i++) {
							var id = new mongoose.Types.ObjectId(req.param("users")[i]);
							models.User.findById(id).exec(function(err, user) {
								if (err) {
									console.log(err);
								}
								if (!user) {
									console.log("Usuario no encontrado");
								}
								else {
									var projects = [];
									if (user.projects) {
										for (var i = 0; i < user.projects.length; i++)
										projects.push(user.projects[i]);
									}
									projects.push(nuevo._id);
									user.projects = projects;
									user.save(function(err) {
										console.log(err);
									});
								}
							});
						}
					}
					else {
						var id = new mongoose.Types.ObjectId(req.param("users"));
						models.User.findById(id).exec(function(err, user) {
							if (err) {
								console.log(err);
							}
							if (!user) {
								req.flash("error", "El usuario no existe");
							}
							else {
								var projects = [];
								if (user.projects) {
									for (var i = 0; i < user.projects.length; i++)
									projects.push(user.projects[i]);
								}
								projects.push(nuevo._id);
								user.projects = projects;
								user.save(function(err) {
									console.log(err);
								});
							}
						})
					}
				}
				req.flash("success", "Proyecto creado correctamente");
			}
			res.redirect("/admin_panel/projects/new");
		});
	});

	app.get("/admin_panel/projects/:name", function(req, res) {
		req.sanitize("name");
		// var id = new mongoose.Types.ObjectId(req.param("id"));

		console.log("auth login");
		var statuses = [];

		var crumbs = []
		crumbs[0] = {
			name: "Administración",
			href: "/admin_panel"
		}

		crumbs[1] = {
			name: "Proyectos",
			href:"/admin_panel/projects/"
		}

		crumbs[2] = {
			name: "Detalle proyecto",
			href: "/admin_panel/projects/" + req.param("id")
		}

		models.Project.findOne({ name: req.param("name") }).populate("created_by").exec(function(err, project) {
			if (err) {
				console.log(err);
				req.flash("error", "Se ha producido un error. Inténtelo nuevamente");
				res.redirect("/admin_panel/projects");
			}

			if (!project) {
				console.log("Proyecto no encontrado");
				req.flash("error", "El proyecto no fue encontrado");
				res.redirect("/admin_panel/projects");
			}
			else {
				models.User.find({ projects: project.id }).exec(function(err, users) {
					if (err) {
						console.log(err);
						req.flash("error", err);
						res.render("project_details", { title: "Administración - Detalle proyecto", crumbs: crumbs, children: [], project: project, users: [], flash: req.flash, active: 2 });
					}

					if (!users) {
						res.render("project_details", { title: "Administración - Detalle proyecto", crumbs: crumbs, children: [], project: project, users: [], flash: req.flash, active: 2 });
					}
					else {
						res.render("project_details", { title: "Administración - Detalle proyecto", crumbs: crumbs, children: [], project: project, users: users, flash: req.flash, active: 2 });
					}
				});
			}
		});
	});

	app.get("/admin_panel/gameobjects", function(req, res) {
		console.log("auth login");

		models.GameObject.find().populate("project").populate("parent").exec(function(err, game_objects) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("admin_game_objects", {title: "Administración - Proyectos", game_objects: [], flash: req.flash(), active: 3 });
			}
			if (!game_objects) {
				res.render("admin_game_objects", {title: "Administración - Proyectos", game_objects: [], flash: req.flash(), active: 3 });
			}
			else {
				res.render("admin_game_objects", {title: "Administración - Proyectos", game_objects: game_objects, flash: req.flash(), active: 3 });
			}
		});
	});

	app.get("/admin_panel/gameobjects/new", function(req, res) {
		console.log("auth login");

		var crumbs = [];
		var projects = [];
		var users = [];
		var tasks = [];
		var parents = [];
		var errors = [];

		crumbs[0] = {
			name: "Administración",
			href: "/admin_panel"
		}

		crumbs[1] = {
			name: "Game Objects",
			href:"/admin_panel/gameobjects/"
		}

		crumbs[2] = {
			name: "Nuevo game object",
			href: "/admin_panel/gameobjects/new"
		}

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
						res.render("game_object_form", { title: "Administración - Crear Nuevo Game Object", projects: results.projects, parents: [], users: results.users, tasks: tasks, crumbs: crumbs, children: [], game_object: {}, flash: req.flash(), active: 3 });
					}
					else {
						res.render("game_object_form", { title: "Administración - Crear Nuevo Game Object", projects: results.projects, parents: parents, users: results.users, tasks: tasks, crumbs: crumbs, children: [], game_object: {}, flash: req.flash(), active: 3 });
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
				req.flash("error", "No fue posible crear el objeto. Inténtelo nuevamente");
			}
			else {
				req.flash("success", "Objeto creado correctamente");
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
								req.flash("error", "El grupo de usuarios al que se le quiso asignar el Game Object no existe");
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
								req.flash("error", "El usuario al que se le quiso asignar el Game Object no existe");
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

			res.redirect("/admin_panel/gameobjects/new");
		});
	});

	app.post("/username/:id", function(req, res) {
		req.sanitize("id");
		var id = new mongoose.Types.ObjectId(req.param("id"));
		models.User.findById(id).exec(function(err, user) {
			if (err) {
				res.send(202, err);
			}
			if (!user) {
				res.send(202, "not found");
			}
			else {
				res.send(200, user.username);
			}
		});
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

	app.get("*", function(req, res) {
		res.send(404, "404");
	});

	function check_username(username, callback) {
		models.User.findOne({username: username.toLowerCase()}).exec(function(err, user) {
			if (!user) {
				callback(true);
			}
			else {
				callback(false);
			}
		});
	}
};
