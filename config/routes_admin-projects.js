module.exports = function(app, models) {
	var mongoose = require("mongoose");
	var async = require("async");

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
			name: "Detalle proyecto <strong>" + req.param("name") + "</strong>",
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

	app.get("/admin_panel/projects/edit/:name", function(req, res) {
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
			name: "Editar proyecto <strong>" + req.param("name") + "</strong>",
			href: "/admin_panel/projects/edit/" + req.param("name")
		});

		var statuses = [];
		statuses[0] = "Activo";
		statuses[1] = "Pausado";
		statuses[2] = "Completado";

		models.Project.findOne({ name: req.param("name") }).populate("created_by").exec(function(err, project) {
			if (err) {
				console.log(err);
				req.flash("error", "Se ha producido un error. Inténtelo nuevamente");
				res.redirect("/admin_panel/projects");
				// res.send(500, err);
			}

			if (!project) {
				console.log("Proyecto no encontrado");
				req.flash("error", "El proyecto no fue encontrado");
				res.redirect("/admin_panel/projects");
				// res.send(500, err);
			}
			else {
				models.User.find().exec(function(err, users) {
					if (err) {
						console.log(err);
						req.flash("error", err);
						res.render("project_form", { title: "Administración - Editar proyecto", project: project, users: [], statuses: statuses, active: 1 });
					}
					if (!users) {
						res.render("project_form", { title: "Administración - Editar proyecto", project: project, users: [], statuses: statuses, active: 1 });
					}
					else {
						res.render("project_form", { title: "Administración - Editar proyecto", project: project, users: users, statuses: statuses, active: 1 });
					}
				});
			}
		});

	});
}
