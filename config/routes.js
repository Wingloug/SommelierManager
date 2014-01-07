module.exports = function(app, models) {
	/*
	  * models: { User, Project, GameObject, UserProject, UserObject, ObjectFile }
	  */

	  app.get("/", function(req, res) {
	  	res.render("home", { title: "Prototipo - Home" , crumbs: [], children: []});
	  });

	// Projects
	app.get("/projects", function(req, res) {
		var crumbs = [];
		var response = [];
		// root
		crumbs[0] = {
			id: -1,
			name: "Projects",
			href: "/projects"
		}
		var user = {
			id: 1,
			username: "testing_user",
		}

		models.UserProject.findAll({
			where: {
				user_id: user.id
			}
		}).success(function(user_projects) {
			var project_ids = [];
			for (var i=0; i < user_projects.length; i++) {
				project_ids[i] = user_projects[i].project_id;
			}

			models.Project.findAll({ where: { id: project_ids} })
				.success(function(projects) {
					for (var i=0; i < projects.length; i++) {
						response[i] = {
							id: projects[i].id,
							name: projects[i].name,
							progress: projects[i].progress,
							status: projects[i].status
						}
					}

					res.render('projects', { title: "Prototipo - Projects", crumbs: crumbs, children: [], projects: response, user: user});
				})
				.error(function() {
					res.render('projects', { title: "Prototipo - Projects", crumbs: crumbs, children: [], projects: [], user: user});
				});

		}).error(function() {

		});
	});

	app.post("/children", function(req, res) {
		var id = req.body.parent;
		var children = [];
		var response = [];
		models.GameObject.findAll({
			where: { parent_id: id }
		}).success(function(children) {
			for (var i = 0; i < children.length; i++ ) {
				response[i] = {
					id : children[i].id,
					name: children[i].name,
				};
			}
			res.send(200, response);
		}).error(function() {
			res.send(202, children);
		});
	});


	app.get("/projects/:project_name", function(req, res) {
		var project_name = req.params.project_name;
		var project_id = -1;
		var crumbs = [];
		var children = [];

		crumbs[0] = {
			id: -1,
			name: "Projects",
			href: "/projects"
		}
		var user = {
			id: 1,
			username: "testing_user",
		}

		models.Project.find({
			where: {
				name: project_name
			}
		}).success(function(project) {
			// Se obtiene el proyecto consultado
			if (project) {
				project_id = project.id;
				models.UserProject.find({
					where: {
						user_id: user.id,
						project_id: project.id
					}
				}).success(function(user_project) {
					// El usuario logeado tiene acceso al proyecto
					if (user_project) {
						models.GameObject.findAll({
							where: {
								project_id: user_project.project_id,
								parent_id: null
							}
						}).success(function(objects) {
							//  Se obtienen todos los objetos asociados al proyecto
							var response = [];
							for (var i = 0; i < objects.length; i++) {
								response[i] = {
									id: objects[i].id,
									name: objects[i].name
								}
							}

							crumbs[1] = {
								id: project_id,
								name: project_name,
								href: "/projects/" + project_name
							}

							models.GameObject.findAll({
								where: {
									project_id: project_id,
									parent_id: null
								}
							}).success(function(objects) {
								// Se obtienen los hijos directos del proyecto (breadcrumbs)
								for (var i = 0; i < objects.length; i++) {
									children[i] = {
										id: objects[i].id,
										name: objects[i].name,
										href: "/projects/" + project_name + "/panel/" + objects[i].id
									}
								}

								res.render('objects_tree', { title: 'Prototipo - Project Objects', path: "/projects/" + project_name + "/",  crumbs: crumbs, children: children, objects: response, user: user});
							}).error(function() {
								res.render('objects_tree', { title: 'Prototipo - Project Objects', path: "/projects/" + project_name + "/",  crumbs: crumbs, children: [], objects: response, user: user});
							});
						}).error(function() {
							// Error al obtener los objetos asociados al proyecto
							res.render('objects_tree', { title: 'Prototipo - Project Objects', path: "/projects/" + project_name + "/", crumbs: crumbs, objects: [], user: user});
						});
					}
					else {
						// El usuario no tiene acceso al proyecto
						res.redirect(401, "/");
					}
				}).error(function() {
					// Error al consultar si el usuario tiene acceso al proyecto
					res.redirect(401, "/");
				});
			}
			else {
				// El proyecto no existe
				res.redirect(404, "/");
			}
		}).error(function() {
			// Error al obtener el proyecto
			res.redirect(404, "/");
		});
	});

	app.get("/projects/:project_name/panel/:object_id", function(req, res) {
		var project_name = req.params.project_name;
		var object = {};
		var object_files = [];
		var children = [];
		var crumbs = [];
		var extra = {};
		var todo= [];
		var doing = [];
		var done = [];

		crumbs[0] = {
			id: -1,
			name: "Projects",
			href: "/projects"
		}
		models.GameObject.find(req.params.object_id)
			.success(function(object) {
				// Se obtiene el objeto consultado
				var response = {
					id: object.id,
					name: object.name,
					description: object.description,
				};
				var branch = object.branch.split(",");

				crumbs[1] = {
					id: object.project_id,
					name: project_name,
					href: "/projects/" + project_name,
				}

				models.GameObject.findAll({
					where: {
						id: branch
					}
				}).success(function(objects) {
					// Se completan los breadcrumbs
					for (var i = 0; i < objects.length; i++) {
						crumbs[i+2] = {
							id: objects[i].id,
							name: objects[i].name,
							href: "/projects/" + project_name + "/panel/" + objects[i].id
						}
					}

					crumbs[i+2] = {
						id: response.id,
						name: response.name,
						href: "/projects/" + project_name + "/panel/" + response.id
					}

					models.ObjectFile.findAll({
						order: [ "type" ],
						where: {
							game_object_id: response.id
						},
					}).success(function(files) {
						// Se obtienen los archivos asociados al objeto
						for (var i=0; i < files.length; i++) {
							object_files[i] = {
								extension: 			files[i].extension,
								path: 				files[i].path,
								original_filename: 	files[i].original_filename,
								filename: 			files[i].filename,
								type: 				files[i].type,
								description: 		files[i].description
							}
						}

						models.GameObject.findAll({
							where: {
								parent_id: response.id
							}
						}).success(function(objects) {
							// Se obtienen los hijos directos del proyecto (breadcrumbs)
							for (var i = 0; i < objects.length; i++) {
								children[i] = {
									id: objects[i].id,
									name: objects[i].name,
									href: "/projects/" + project_name + "/panel/" + objects[i].id
								}
							}

							models.UserObject.find({
								where: {
									user_id: 1,
									game_object_id: req.params.object_id
								}
							}).success(function(user_object) {
								// Se determina si es que existe contenido específico para el usuario que mostrar adicionalmente
								if (user_object) {
									extra.user_object_id = user_object.id;
									extra.role = user_object.role;
									extra.task_description = user_object.task_description;
									extra.progress = user_object.progress;

									models.Board.find({
										where: {
											user_object_id: user_object.id
										}
									}).success(function(board) {
										if (board) {
											var id = board.id;
											extra.board_id = board.id;
											// Se encuentran los items para cada contenedor del panel to do
											models.BoardItem.findAll({
												where: {
													board_id: id,
													container: "todo"
												}
											}).success(function(todo_items) {
												for (var i = 0; i < todo_items.length; i ++) {
													todo[i] = {
														id: todo_items[i].id,
														board_id: todo_items[i].board_id,
														container: todo_items[i].container,
														description: todo_items[i].description,
														label: todo_items[i].label
													}
												}

												// Se encuentran los items para cada contenedor del panel doing
												models.BoardItem.findAll({
													where: {
														board_id: id,
														container: "doing"
													}
												}).success(function(doing_items) {
													for (var i = 0; i < doing_items.length; i ++) {
														doing[i] = {
															id: doing_items[i].id,
															board_id: doing_items[i].board_id,
															container: doing_items[i].container,
															description: doing_items[i].description,
															label: doing_items[i].label
														}
													}

													// Se encuentran los items para cada contenedor del panel done
													models.BoardItem.findAll({
														where: {
															board_id: id,
															container: "done"
														}
													}).success(function(done_items) {
														for (var i = 0; i < done_items.length; i ++) {
															done[i] = {
																id: done_items[i].id,
																board_id: done_items[i].board_id,
																container: done_items[i].container,
																description: done_items[i].description,
																label: done_items[i].label
															}
														}

														res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: object_files, extra: extra, todo: todo, doing: doing, done: done });
													});
												});
											});
										}
										else {
											// Asociar board al usuario
											models.Board.saveRecord({
												user_object_id: extra.user_object_id
											}, function(board) {
												extra.board_id = board.id;
												res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: object_files, extra: extra, todo: todo, doing: doing, done: done });
											});
										}
									});
								}
								else {
									res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: object_files, extra: extra, todo: todo, doing: doing, done: done });
								}
							}).error(function() {
								res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: children, object: response, files: object_files, extra: [], todo: todo, doing: doing, done: done });
							});
						}).error(function() {
							res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: [], object: response, files: object_files, extra: [], todo: todo, doing: doing, done: done });
						});

					}).error(function() {
						res.render('panel', { title: 'Prototipo - Panel', path: "/projects/" + project_name + "/panel/", crumbs: crumbs, children: [], object: response, files: [], extra: [], todo: todo, doing: doing, done: done });
					});

				})
			}).error(function() {
				res.send(404, "404");
			})
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
			models.BoardItem.find(req.body.id).success(function(item_original) {
				original = item_original;
				// Si el item ahora es marcado como "done", incrementar completed_count de Board
				if ((item.container === "done") && (item.container !== original.container)){
					// Actualizar item
					models.BoardItem.update({
						container: item.container,
						description: item.description,
						label: item.label
					}, {
						id: item.id
					}).success(function() {
						// Incrementar completed_count
						models.Board.find(original.board_id).success(function(board) {
							board.increment("completed_count", 1).success(function(board) {
								board.reload().success(function() {
									// Actualizar progress de UserObject
									var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
									progress = Number(progress.toFixed(1));
									models.UserObject.find(board.user_object_id).success(function(user_object) {
										user_object.updateAttributes({ progress: progress }).success(function() {
											console.log("Progreso de UserObject actualizado " + progress);
											// Actualizar progress de Project
											models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
												// progreso promedio
												var prom = 0;
												for (var i = 0; i < user_objects.length; i++) {
													prom += user_objects[i].progress;
												}

												prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
												prom = Number(prom.toFixed(1));
												models.Project.find(user_object.project_id).success(function(project) {
													project.updateAttributes({ progress: prom }).success(function() {
														console.log("Progreso Project actualizado " + prom);
														res.send(200, item);
													}).error(function(err) {
														console.log(err);
														res.send(500, err);
													});
												}).error(function(err) {
													console.log(err);
													res.send(500, err);
												});
											}).error(function(err) {
												console.log(err);
												res.send(500, err);
											});
										}).error(function(err) {
											console.log(err);
											res.send(500, err);
										});
									}).error(function(err) {
										console.log(err);
										res.send(500, err);
									});
								}).error(function(err) {
									console.log(err);
									res.send(500, err);
								});
							}).error(function(err) {
								console.log(err);
								res.send(500, err);
							});
						})
					}).error(function(err) {
						console.log(err);
						res.send(500, err);
					});
				}
				// Si el item antes estaba marcado como "done", decrementar completed_count de Board
				else if ((original.container === "done") && (item.container !== original.container)) {
					// Actualizar item
					models.BoardItem.update({
						container: item.container,
						description: item.description,
						label: item.label
					}, {
						id: item.id
					}).success(function() {
						// Incrementar completed_count
						models.Board.find(original.board_id).success(function(board) {
							board.decrement("completed_count", 1).success(function(board) {
								board.reload().success(function() {
									// Actualizar progress de UserObject
									var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
									progress = Number(progress.toFixed(1));
									models.UserObject.find(board.user_object_id).success(function(user_object) {
										user_object.updateAttributes({ progress: progress }).success(function() {
											console.log("Progreso de UserObject actualizado " + progress);
											// Actualizar progress de Project
											models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
												// progreso promedio
												var prom = 0;
												for (var i = 0; i < user_objects.length; i++) {
													prom += user_objects[i].progress;
												}

												prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
												prom = Number(prom.toFixed(1));
												models.Project.find(user_object.project_id).success(function(project) {
													project.updateAttributes({ progress: prom }).success(function() {
														console.log("Progreso Project actualizado " + prom);
														res.send(200, item);
													}).error(function(err) {
														console.log(err);
														res.send(500, err);
													});
												}).error(function(err) {
													console.log(err);
													res.send(500, err);
												});
											}).error(function(err) {
												console.log(err);
												res.send(500, err);
											});
										}).error(function(err) {
											console.log(err);
											res.send(500, err);
										});
									}).error(function(err) {
										console.log(err);
										res.send(500, err);
									});
								}).error(function(err) {
									console.log(err);
									res.send(500, err);
								});
							}).error(function(err) {
								console.log(err);
								res.send(500, err);
							});
						})
					}).error(function(err) {
						console.log(err);
						res.send(500, err);
					});
				}
				// Actualizar items
				else {
					// Actualizar item
					models.BoardItem.update({
						container: item.container,
						description: item.description,
						label: item.label
					}, {
						id: item.id
					}).success(function() {
						res.send(200, item);
					}).error(function(err) {
						console.log(err);
						res.send(500, err);
					});
				}
			}).error(function(err) {
				console.log(err);
				res.send(202, err);
			});
		}
		// Crear item
		else {
			models.BoardItem.saveRecord({
				board_id: item.board_id,
				container: item.container,
				description: item.description,
				label: (item.label ? item.label : "")
			}, function(nuevo, err) {
				if (err) {
					console.log(err);
					res.send(400, err);
				}
				else {
					if (nuevo.container === "done") {
						// Actualizar completed_count de Board
						models.Board.find(nuevo.board_id).success(function(board) {
							board.increment(["items_count", "completed_count"], 1).success(function(board) {
								// Actualizar progress de UserObject
								board.reload().success(function() {
									var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
									progress = Number(progress.toFixed(1));
									models.UserObject.find(board.user_object_id).success(function(user_object) {
										user_object.updateAttributes({ progress: progress }).success(function() {
											console.log("Progreso de UserObject actualizado " + progress);
											// Actualizar progress de Project
											models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
												// progreso promedio
												var prom = 0;
												for (var i = 0; i < user_objects.length; i++) {
													prom += user_objects[i].progress;
												}

												prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
												prom = Number(prom.toFixed(1));
												models.Project.find(user_object.project_id).success(function(project) {
													project.updateAttributes({ progress: prom }).success(function() {
														console.log("Progreso Project actualizado " + prom);
														res.send(200, nuevo);
													}).error(function(err) {
														console.log(err);
														res.send(500, err);
													});
												}).error(function(err) {
													console.log(err);
													res.send(500, err);
												});
											}).error(function(err) {
												console.log(err);
												res.send(500, err);
											});
										}).error(function(err) {
											console.log(err);
											res.send(500, err);
										});
									}).error(function(err) {
										console.log(err);
										res.send(500, err);
									});
								});
							}).error(function(err) {
								console.log(err);
								res.send(500, err);
							});
						}).error(function(err) {
							console.log(err);
							res.send(500, err);
						});
					}
					else {
						// Actualizar items_count de Board
						models.Board.find(nuevo.board_id).success(function(board) {
							board.increment("items_count", 1).success(function(board) {
								// Actualizar progress de UserObject
								board.reload().success(function() {
									var progress = ( board.items_count > 0 ? board.completed_count * 100/ board.items_count : 0 );
									progress = Number(progress.toFixed(1));
									models.UserObject.find(board.user_object_id).success(function(user_object) {
										user_object.updateAttributes({ progress: progress }).success(function() {
											console.log("Progreso de UserObject actualizado " + progress);
											// Actualizar progress de Project
											models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
												// progreso promedio
												var prom = 0;
												for (var i = 0; i < user_objects.length; i++) {
													prom += user_objects[i].progress;
												}

												prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
												prom = Number(prom.toFixed(1));
												models.Project.find(user_object.project_id).success(function(project) {
													project.updateAttributes({ progress: prom }).success(function() {
														console.log("Progreso Project actualizado " + prom);
														res.send(200, nuevo);
													}).error(function(err) {
														console.log(err);
														res.send(500, err);
													});
												}).error(function(err) {
													console.log(err);
													res.send(500, err);
												});
											}).error(function(err) {
												console.log(err);
												res.send(500, err);
											});
										}).error(function(err) {
											console.log(err);
										});
									});
								});
							}).error(function(err) {
								res.send(500, err);
							});
						}).error(function(err) {
							res.send(500, err);
						})
					}
				}
			});
		}
	});

	app.post("/delete_item", function(req, res) {
		// id
		if (req.body.id) {
			var board_item = {};
			models.BoardItem.find(req.body.id).success(function(item) {
				// Actualizar items_count de Board
				board_item = item;
				if (board_item.container === "done") {
					// Actualizar completed_count de Board
					models.Board.find(item.board_id).success(function(board) {
						board.decrement(["items_count", "completed_count"], 1).success(function(board) {
							// Actualizar progress de UserObject
							board.reload().success(function() {
								var progress = ( board.items_count ? board.completed_count * 100/ board.items_count : 0);
								progress = Number(progress.toFixed(1));
								models.UserObject.find(board.user_object_id).success(function(user_object) {
									user_object.updateAttributes({ progress: progress }).success(function() {
										console.log("Progreso de UserObject actualizado " + progress);
										// Actualizar progress de Project
										models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
											// progreso promedio
											var prom = 0;
											for (var i = 0; i < user_objects.length; i++) {
												prom += user_objects[i].progress;
											}

											prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
											prom = Number(prom.toFixed(1));
											models.Project.find(user_object.project_id).success(function(project) {
												project.updateAttributes({ progress: prom }).success(function() {
													console.log("Progreso Project actualizado " + prom);
													// Destroy
													board_item.destroy().success(function() {
														res.send(200, "destroyed");
													}).error(function(err) {
														res.send(500, err);
													});
												}).error(function(err) {
													console.log(err);
													res.send(500, err);
												});
											}).error(function(err) {
												console.log(err);
												res.send(500, err);
											});
										}).error(function(err) {
											console.log(err);
											res.send(500, err);
										});
									}).error(function(err) {
										console.log(err);
										res.send(500, err);
									});
								}).error(function(err) {
									console.log(err);
									res.send(500, err);
								});
							}).error(function(err) {
								console.log(err);
								res.send(500, err);
							});
						}).error(function(err) {
							console.log(err);
							res.send(500, err);
						});
					}).error(function(err){
						console.log(err);
						res.send(500, err);
					});
				}
				else {
					models.Board.find(item.board_id).success(function(board) {
						board.decrement("items_count", 1).success(function(board) {
							// Actualizar progress de UserObject
							board.reload().success(function() {
								var progress = ( board.items_count ? board.completed_count * 100/ board.items_count : 0);
								models.UserObject.find(board.user_object_id).success(function(user_object) {
									user_object.updateAttributes({ progress: progress }).success(function() {
										console.log("Progreso de UserObject actualizado " + progress);
										// Actualizar progress de Project
										models.UserObject.findAll({ project_id: user_object.project_id }).success(function(user_objects) {
											// progreso promedio
											var prom = 0;
											for (var i = 0; i < user_objects.length; i++) {
												prom += user_objects[i].progress;
											}

											prom = ( user_objects.length > 0 ? prom / user_objects.length : 0);
											prom = Number(prom.toFixed(1));
											models.Project.find(user_object.project_id).success(function(project) {
												project.updateAttributes({ progress: prom }).success(function() {
													console.log("Progreso Project actualizado " + prom);
													// Destroy
													board_item.destroy().success(function() {
														res.send(200, "destroyed");
													}).error(function(err) {
														res.send(500, err);
													});
												}).error(function(err) {
													console.log(err);
													res.send(500, err);
												});
											}).error(function(err) {
												console.log(err);
												res.send(500, err);
											});
										}).error(function(err) {
											console.log(err);
											res.send(500, err);
										});
									}).error(function(err) {
										console.log(err);
										res.send(500, err);
									});
								}).error(function(err) {
									console.log(err);
									res.send(500, err);
								});
							}).error(function(err){
								console.log(err);
								res.send(500, err);
							});
						}).error(function(err) {
							console.log(err);
							res.send(500, err);
						});
					}).error(function(err) {
						console.log(err);
						res.send(500, err);
					});
				}
			}).error(function(err) {
				res.send(400, err);
			});
		}
		else {
			res.send(400);
		}
	});

	app.get("/admin_panel", function(req, res) {
		console.log("auth login");
		res.render("admin", {title: "Admin"});
	});

	app.get("/admin_panel/users", function(req, res) {
		console.log("auth login");
		var users = [];
		models.User.findAll().success(function(response) {
			for (var i = 0; i < response.length; i++) {
				users[i] = {
					id: response[i].id,
					username: response[i].username,
					email: response[i].email,
					name: response[i].name,
					last_name: response[i].last_name,
					role: response[i].role
				}
			}
			res.render("users", {title: "Administración - Usuarios", users: users});
		}).error(function(err) {
			console.log(err);
			res.render("users", {title: "Administración - Usuarios", users: users});
		});
	});

	app.get("/admin_panel/users/new", function(req, res) {
		console.log("auth login");
		var roles = [];
		roles[0] = "admin";
		roles[1] = "user";

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
			href: "/admin_panel/new"
		}
		res.render("user_form", {title: "Administración - Crear Nuevo Usuario", crumbs: crumbs, children: [], user: {}, roles: roles});
	});

	app.post("/admin_panel/users/new", function(req, res) {
		// username, password, email, name, last_name, rol
		if (!check_username(req.body.username)) {
			res.send(202, "Username already used");
		}

		if (!check_password(req.body.password, req.body.password_repeat)) {
			res.send(202, "Password doesn't match");
		}

		res.send(200, req.body);

	});

	app.get("*", function(req, res) {
		res.send(404, "404");
	});

	function check_username(username) {
		models.User.find({
			where: {
				username: username
			}
		}).success(function(user) {
			if (!user) {
				return true;
			}
			else {
				return false;
			}
		})
	}

	function check_password(password, password_repeat) {
		return password === password_repeat;
	}
};
