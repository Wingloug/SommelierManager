(function getChildren() {
	var objetos = $(".obj_expand");
	objetos.off("click");
	objetos.click(function(e) {
		e.preventDefault();
		var children = $(this).parent().children(".child");
		var icon = $(this).children(".icon:first");
		// Desplegar
		if (icon.hasClass("triangle_right-icon")) {
			icon.toggleClass("triangle_right-icon triangle_down-icon");

			children.removeClass("hide");
		}
		// Ocultar
		else {
			icon.toggleClass("triangle_down-icon triangle_right-icon");
			children.addClass("hide");
		}

		// Verificar si es que ya se crearon los hijos
		if (!children.length) {
			var id = $(this).attr("id");
			$.post("/children", {parent: id}).done(function(data) {
				// var res = JSON.parse(data);
				console.log(data);
				var res = data;
				if (res.length) {
					for (var i = 0; i < res.length; i++) {
						var children_container = $("<div />").attr("id", res[i].id + "_container").attr("class", "child").appendTo("#" + id + "_container");
						var child = $("<a href='#'/>").attr("id", res[i].id).attr("class", "obj_expand");
						$("<i class='icon triangle_right-icon' />").appendTo(child);
						var goTo = $("<a />").attr("href", location.pathname + "/panel/" + res[i].id).text(res[i].name);
						children_container.append(child);
						children_container.append(goTo);
						getChildren();
					}
				}
				else {
					var children_container = $("<div class='child' />").appendTo("#" + id + "_container");
				}
			});
		}
	});
})();
