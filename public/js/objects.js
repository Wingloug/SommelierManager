(function getChildren() {
	var objetos = new HTML_object(document).findChildren("obj_expand");
	for (var i = 0; i < objetos.length; i++) {
		objetos[i].object.onclick = function(e) {
			e.preventDefault();
			var children = new HTML_object(this.parentNode).findChildren("child");
			var icon = new HTML_object(this.getElementsByClassName("icon")[0]);
			// Desplegar
			if (icon.hasClass("triangle_right-icon")) {
				icon.toggleClass("triangle_right-icon", "triangle_down-icon");

				for (var j=0; j < children.length; j++) {
					if (children[j].object.id) {
						children[j].removeClass("hide");
					}
				}
			}
			// Ocultar
			else {
				icon.toggleClass("triangle_down-icon", "triangle_right-icon");

				for (var j=0; j < children.length; j++) {
					if (children[j].object.id) {
						children[j].addClass("hide");
					}
				}
			}
			// Verificar si es que ya se crearon los hijos
			if (!children.length) {
				var id = this.id;
				var req = new XMLHttpRequest();
				req.open("POST", "/children", true);
				req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				req.send("parent=" + id);

				req.onreadystatechange = function() {
					if (req.readyState==4 && req.status==200) {
						var res = JSON.parse(req.responseText);
						if (res.length) {
							for (var j = 0; j < res.length; j++) {
								var children_container = document.createElement("div");
								children_container.id = res[j].id + "_container";
								children_container.className = "child";
								document.getElementById(id + "_container").appendChild(children_container);

								var child = document.createElement("a");
								child.href = "#";
								child.id = res[j].id;
								child.className = "obj_expand";
								var icon = document.createElement("i");
								icon.className = "icon triangle_right-icon";
								child.appendChild(icon);
								var goTo = document.createElement("a");
								goTo.href = location.pathname + "/panel/" + res[j].id;
								goTo.innerHTML = res[j].name;
								//- child.innerHTML = res[j].name
								children_container.appendChild(child);
								children_container.appendChild(goTo);
								getChildren();
							}
						}
						else {
							var children_container = document.createElement("div");
							children_container.className = "child";
							document.getElementById(id + "_container").appendChild(children_container);
						}
					}
				}
			}
		}
	}
})();
