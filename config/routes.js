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
		req.sanitize("path");
		req.sanitize("filename");
		var path = req.param('path');
		var filename = req.param("filename");

		res.download(app.root + "/public" + path, filename, function(err) {
			if(err) {
				res.send(404, "Archivo no encontrado");
			}
		});
	});

	app.post("/upload", function(req, res) {
		console.log(req.files);
		res.send(200);
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

	app.get("*", function(req, res) {
		res.send(404, "404");
	});
};
