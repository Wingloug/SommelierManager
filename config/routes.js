module.exports = function(app, models) {
	var mongoose = require("mongoose");
	var async = require("async");
	/*
	  * models: { User, Project, GameObject, Board, File }
	  */

	  app.get("/", function(req, res) {
	  	res.render("home", { title: "Prototipo - Home" });
	  });

	// Projects
	app.get("/projects", function(req, res) {
		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
			id: -1,
			name: "Projects",
			href: "/projects"
		});

		models.User.findById(app.locals.user.id).populate("projects").exec(function(err, user) {
			if (err || !user) {
				res.render('projects', { title: "Prototipo - Projects", projects: [] });
			}

			res.render('projects', { title: "Prototipo - Projects", projects: user.projects });
		});
	});

	app.post("/children", function(req, res) {
		req.sanitize("parent");
		var id = new mongoose.Types.ObjectId(req.param("parent"));
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

		var info = "";

		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
			id: -1,
			name: "Projects",
			href: "/projects"
		});

		async.waterfall([
			function(callback) {
				models.Project.findOne({ name: project_name }).exec(function(err, project) {
					if (err) {
						callback("Ocurrió un error inesperado. Intente nuevamente.");
					}
					if (!project) {
						callback("Proyecto no encontrado");
					}
					else {
						app.locals.crumbs.push({
							id: project.id,
							name: project_name,
							href: "/projects/" + project.name
						});
						callback(null, project)
					}
				});
			},
			function(project, callback) {
				// Comparar permiso de acceso del usuario logeado al proyecto
				if (app.locals.user.projects.indexOf(project.id) != -1) {
					// Se obtienen los hijos directos del proyecto (objetos sin padre)
					models.GameObject.find({ project: project.id }).exists("parent", false).exec(function(err, game_objects) {
						if (err) {
							console.log(err);
							callback("Ocurrió un error inesperado. Intente nuevamente.");
						}
						if (!game_objects) {
							// req.flash("info", "El proyecto no tiene objetos asociados");
							info = "El proyecto no tiene objetos asociados";
							callback(null, [])
						}
						else {
							for (var i = 0; i < game_objects.length; i++) {
								app.locals.children.push({
									id: game_objects[i].id,
									name: game_objects[i].name,
									href: "/projects/" + project.name + "/panel/" + game_objects[i].id
								});
							}
							callback(null, game_objects);
						}
					});
				}
				else {
					callback("No tiene acceso al proyecto " + project.name);
				}
			},
		], function(err, results) {
			if (err) {
				req.flash("error", err);
				if (info) {
					req.flash("info", info);
				}
				res.redirect("/projects");
			}
			else {
				if (info) {
					req.flash("info", info);
				}
				console.log(req.flash);
				res.render('objects_tree', { title: 'Prototipo - Project Objects', path: "/projects/" + project_name + "/", objects: results});
			}
		});
	});

	app.get("/projects/:project_name/panel/:object_id", function(req, res) {
		req.sanitize("project_name");
		req.sanitize("object_id");

		var project_name = req.param("project_name");
		var response = {};
		var game_object_files = [];
		var extra = {};
		var todo= [];
		var doing = [];
		var done = [];

		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
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
					async.waterfall([
						function(callback) {
							game_object_files = game_object.files;
							var branch = game_object.branch;

							response.id = game_object.id,
							response.name = game_object.name,
							response.description = game_object.description

							app.locals.crumbs.push({
								id: game_object.project,
								name: project_name,
								href: "/projects/" + project_name
							});

							// Se completan los breadcrumbs
							if (branch.length) {
								models.GameObject.find().in("_id", branch).exec(function(err, game_objects) {
									if (err) {
										console.log(err);
										callback(null, "next");
									}

									if (!game_objects) {
										app.locals.crumbs.push({
											id: response.id,
											name: response.name,
											href: "/projects/" + project_name + "/panel/" + response.id
										});
										callback(null, "next");
									}
									else {
										for (var i = 0; i < game_objects.length; i++) {
											app.locals.crumbs.push({
												id: game_objects[i].id,
												name: game_objects[i].name,
												href: "/projects/" + project_name + "/panel/" + game_objects[i].id
											});
										}

										app.locals.crumbs.push({
											id: response.id,
											name: response.name,
											href: "/projects/" + project_name + "/panel/" + response.id
										});
										callback(null, "next");
									}
								});
							}
							else {
								app.locals.crumbs.push({
									id: response.id,
									name: response.name,
									href: "/projects/" + project_name + "/panel/" + response.id
								});
								callback(null, "next");
							}
						},
						function(arg, callback) {
							// Se obtienen los hijos directos del objeto (breadcrumbs)
							models.GameObject.find({ parent: game_object.id }).exec(function(err, game_objects) {
								if (err) {
									console.log(err);
									callback(null, "next");
								}
								if (!game_objects) {
									callback(null, "next");
								}
								else {
									for (var i = 0; i < game_objects.length; i++) {
										app.locals.children.push({
											id: game_objects[i].id,
											name: game_objects[i].name,
											href: "/projects/" + project_name + "/panel/" + game_objects[i].id
										});
									}
									callback(null, "next");
								}
							});
						},
						function(arg, callback) {
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
								callback(null, extra);
							}
							else {
								// Usuario con acceso readonly (no tiene asignado el objeto)
								callback(null, {});
							}
						},
						function(extra, callback) {
							if (!extra) {
								// Usuario con acceso readonly (no tiene asignado el objeto)
								callback("end");
							}
							else {
								if (extra.board_id) {
									// Se obtiene el board correspondiente
									models.Board.findById(extra.board_id).exec(function(err, board) {
										if (err) {
											console.log(err);
											callback("redirect");
										}
										if (!board) {
											// Crear un board nuevo y asociarlo al usuario
											var nuevo_board = new models.Board();
											nuevo_board.save(function(err, nuevo) {
												if (err) {
													console.log(err);
													callback("redirect");
												}
												if (nuevo) {
													for (var i = 0; i < app.locals.user.objects.length; i++) {
														if (app.locals.user.objects[i].game_object === game_object.id) {
															app.locals.user.objects[i].board = nuevo.id;
															break;
														}
													}
													callback(null, nuevo);
												}
											});
										}
										else {
											callback(null, board);
										}
									});
								}
								else {
									// Usuario con acceso readonly (no tiene asignado el objeto)
									callback("end");
								}
							}
						}
					], function(err, results) {
						if (err === "end") {
							req.flash("info", "Acceso sólo de lectura");
							res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", object: response, files: game_object_files, extra: {}, todo: [], doing: [], done: [] });
						}
						else if (err == "redirect") {
							res.redirect("/project/" + project_name);
						}
						else {
							todo = (results.todo_items.length ? results.todo_items: []);
							doing = (results.doing_items.length ? results.doing_items : []);
							done = (results.done_items.length ? results.done_items : []);
							res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", object: response, files: game_object_files, extra: extra, todo: todo, doing: doing, done: done });
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

	app.get("/admin_panel/users", function(req, res) {
		console.log("auth login");
		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];

		var users = [];
		models.User.find().exec(function(err, users) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("admin_users", {title: "Administración - Usuarios", users: [], active: 0 });
			}
			if (!users) {
				res.render("admin_users", {title: "Administración - Usuarios", users: [], active: 0 });
			}
			else {
				res.render("admin_users", {title: "Administración - Usuarios", users: users, active: 0 });
			}
		});
	});

	app.get("/admin_panel/users/new", function(req, res) {
		console.log("auth login");
		var roles = [];
		roles[0] = "admin";
		roles[1] = "user";

		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
			name: "Usuarios",
			href:"/admin_panel/users/"
		});

		app.locals.crumbs.push({
			name: "Nuevo usuario",
			href: "/admin_panel/users/new"
		});

		models.Project.find().exec(function(err, projects) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("user_form", { title: "Administración - Crear Nuevo Usuario", user: {}, projects: [], roles: roles, active: 0 });
			}
			if (!projects) {
				res.render("user_form", { title: "Administración - Crear Nuevo Usuario", user: {}, projects: [], roles: roles, active: 0 });
			}
			else {
				res.render("user_form", { title: "Administración - Crear Nuevo Usuario", user: {}, projects: projects, roles: roles, active: 0 });
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
		req.sanitize("role");

		req.assert("password", "La contraseña y su confimación no coinciden").equals(req.param("password_repeat"));

		if (req.param("email")) {
			req.assert("email", "Email no válido").isEmail();
		}

		var errors = [];
		var successes = [];
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
				user.role = req.param("role");

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
						errors.push("No fue posible crear el usuario. Inténtelo nuevamente");
					}
					else {
						successes.push("Usuario creado correctamente");
					}
					if (errors.length) {
						req.flash("error", errors);
					}
					else if (successes.length) {
						req.flash("success", successes);
					}
					res.redirect("/admin_panel/users/new");
				});
			}
			else {
				// Existen errores, se devuelve el objeto enviado (sin passwords)
				var roles = [];
				roles[0] = "Administrador";
				roles[1] = "Usuario";

				// Reiniciar crumbs, children
				app.locals.crumbs = [];
				app.locals.children = [];
				app.locals.crumbs.push({
					name: "Usuarios",
					href:"/admin_panel/users/"
				});

				app.locals.crumbs.push({
					name: "Nuevo usuario",
					href: "/admin_panel/users/new"
				});

				var user = {};
				user.username = req.param("username");
				user.password = "";
				user.email = req.param("email");
				user.name = req.param("name");
				user.last_name = req.param("last_name");
				user.role = req.param("role");

				models.Project.find().exec(function(err, projects) {
					if (err) {
						console.log(err);
						errors.push(err);
						req.flash("error", errors);
						res.render("user_form", { title: "Administración - Crear Nuevo Usuario", flag: "new", user: user, projects: [], roles: roles, active: 0 });
					}
					if (!projects) {
						if (errors.length) {
							req.flash("error", errors);
						}
						res.render("user_form", { title: "Administración - Crear Nuevo Usuario", flag: "new", user: user, projects: [], roles: roles, active: 0 });
					}
					else {
						if (errors.length) {
							req.flash("error", errors);
						}
						res.render("user_form", { title: "Administración - Crear Nuevo Usuario", flag: "new", user: user, projects: projects, roles: roles, active: 0 });
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
				res.render("admin_projects", {title: "Administración - Proyectos", projects: [], active: 1 });
			}
			if (!projects) {
				res.render("admin_projects", {title: "Administración - Proyectos", projects: [], active: 1 });
			}
			else {
				res.render("admin_projects", {title: "Administración - Proyectos", projects: projects, active: 1 });
			}
		});
	});

	app.get("/admin_panel/projects/new", function(req, res) {
		console.log("auth login");
		var statuses = [];
		statuses[0] = "Activo";
		statuses[1] = "Pausado";
		statuses[2] = "Completado";

		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
			name: "Proyectos",
			href:"/admin_panel/projects/"
		});

		app.locals.crumbs.push({
			name: "Nuevo proyecto",
			href: "/admin_panel/projects/new"
		});

		models.User.find().exec(function(err, users) {
			if (err) {
				console.log(err);
				req.flash("error", err);
				res.render("project_form", { title: "Administración - Crear Nuevo Proyecto", users: [], project: {}, statuses: statuses, active: 1 });
			}
			if (!users) {
				res.render("project_form", { title: "Administración - Crear Nuevo Proyecto", users: [], project: {}, statuses: statuses, active: 1 });
			}
			else {
				res.render("project_form", { title: "Administración - Crear Nuevo Proyecto", users: users, project: {}, statuses: statuses, active: 1 });
			}
		});
	});

	app.post("/admin_panel/projects/new", function(req, res) {
		// name, progress, status, users
		req.sanitize("name").trim();
		req.sanitize("progress").toInt();
		req.sanitize("status").toInt();
		req.sanitize("users");

		var errors = [];

		var project = new models.Project();
		project.name = req.param("name");
		project.status = req.param("status");
		project.created_by = new mongoose.Types.ObjectId("52f84ef58f6a11cf3a28473d");

		project.save(function(err, nuevo) {
			if (err) {
				console.log(err);
				errors.push("No fue posible crear el proyecto. Inténtelo nuevamente");
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
								errors.push("El usuario no existe");
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
			if (errors.length) {
				req.flash("error", errors);
			}
			res.redirect("/admin_panel/projects/new");
		});
	});

	app.get("/admin_panel/projects/:name", function(req, res) {
		req.sanitize("name");

		console.log("auth login");
		var statuses = [];

		// Reiniciar crumbs, children
		app.locals.crumbs = [];
		app.locals.children = [];
		app.locals.crumbs.push({
			name: "Proyectos",
			href:"/admin_panel/projects/"
		});

		app.locals.crumbs.push({
			name: "Detalle proyecto",
			href: "/admin_panel/projects/" + req.param("id")
		});

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
						res.render("project_details", { title: "Administración - Detalle proyecto", project: project, users: [], active: 1 });
					}

					if (!users) {
						res.render("project_details", { title: "Administración - Detalle proyecto", project: project, users: [], active: 1 });
					}
					else {
						res.render("project_details", { title: "Administración - Detalle proyecto", project: project, users: users, active: 1 });
					}
				});
			}
		});
	});

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
