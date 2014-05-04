module.exports = function(app, models) {
	var mongoose = require("mongoose");
	var async = require("async");

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

		check_username(req.param("username"), function(disponible) {
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
}
