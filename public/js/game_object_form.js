(function() {
	$("#del_0").click(function(e) {
		var index = $(this).attr("id").split("_")[1];
		if (index > 0) {
			$(this).parents(".users").remove();
		}
		else {
			var id = $(this).parents(".users").find("select:first");
			id.find("option[value='']").prop("selected", true);
			id.change();
		}
	});

	$("#id_0").change(function() {
		var index = $(this).attr("id").split("_")[1];
		var vacio = $("#task_" + index).children("option[value='']");
		if ($(this).prop("value")) {
			if (vacio.length) {
				vacio.remove();
			}
			$("#task_" + index).prop("disabled", false);
			$("#descr_" + index).prop("disabled", false);
			$("#add_user").prop("disabled", false);
		}
		else {
			if (!vacio.length) {
				$("#task_" + index).prepend("<option value='' selected />");
			}
			else {
				vacio.prop("selected", true);
			}
			$("#task_" + index).prop("disabled", true);
			$("#descr_" + index).prop("disabled", true);
			$("#add_user").prop("disabled", true);
		}
	});

	$("#add_user").click(function(e) {
		if ($(".users select:first option:selected").val()) {
			var form = $(".users:last").clone(true);
			var index = 	parseInt(form.find("select:first").attr("id").split("_")[1]);
			index++;
			var del = form.find("button");
			var id = form.find("select:eq(0)");
			var task = form.find("select:eq(1)");
			var descr = form.find("select:eq(2)");

			del.show();
			del.attr("id", "del_" + index);
			id.attr("id", "id_" + index);
			task.attr("id", "task_" + index);
			descr.attr("id", "descr_" + index);

			// Reiniciar la selección (Eliminar opción "Ninguno")
			if (id.children("option[value='']").length) {
				id.children("option[value='']").remove();
				task.children("option[value='']").remove();
			}

			task.prop("disabled", false);
			descr.prop("disabled", false).val("");

			$('.users:last').after(form);
		}
	});

	$("#parent").change(function() {
		var project = $(this).children("option:selected").data("project");
		var branch = $(this).children("option:selected").data("branch");

		if (project) {
			$("#project").children("option[value='" + project + "']").prop("selected", true);
			$("#project").prop("disabled", true);
			$("#hidden_project").prop("disabled", false);
			$("#hidden_project").prop("value", project);
			$("#branch").prop("value", branch);
		}
		else {
			$("#project").prop("disabled", false);
			$("#hidden_project").prop("disabled", true);
			$("#branch").prop("value", "");
		}
	});

	var game_objects = [];

	$("#project").children("option").each(function() {
		game_objects[$(this).prop("value")] = [];
	});

	$("#parent").children("option").each(function() {
		var project_id = $("#project").children("option:selected").prop("value");
		if ($(this).prop("value")) {
			game_objects[project_id].push({ id: $(this).prop("value"), name: $(this).text(), branch: $(this).data("branch") });
		}
	});

	$("#project").change(function() {
		var project_id = $(this).children("option:selected").prop("value");
		$("#parent").children("option").remove();

		if (game_objects[project_id].length) {
			// Los objetos ya fueron traídos del server
			$("<option value='' data-project='' />").text("Ninguno").appendTo("#parent");
			for (var i = 0; i < game_objects[project_id].length; i++) {
				var option = $("<option value='" + game_objects[project_id][i].id + "' data-project='" + project_id + "' data-branch='" + game_objects[project_id][i].branch + "' />").text(game_objects[project_id][i].name);
				$("#parent").append(option);
			}
		}
		else {
			$.post("/game_objects", {project_id: project_id}).done(function(data) {
				if (data.length) {
					for (var i = 0; i < data.length; i++) {
						game_objects[project_id].push({ id: data[i].id, name: data[i].name, branch: data[i].branch });
					}
					$("#project").change();
				}
				else {
					$("<option value='' data-project='' />").text("Ninguno").appendTo("#parent");
				}
			})
		}
	})
})();
