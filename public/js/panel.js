(function() {
	var containers = document.getElementsByClassName("board-container");
	for (var i = 0; i < containers.length; i++) {
		containers[i].addEventListener("drop", function(e) {
			var item_id = e.dataTransfer.getData("id");
			var item_contenedor = e.dataTransfer.getData("contenedor");
			var target = e.target;
			var item = $("#" + item_id);
			var label = item.find(".item-label.selected").get(0).className.split(" ")[1];
			var target_contenedor = "";
			if($(target).hasClass("item-content")){
				$(target).parent().before(document.getElementById(item_id));
				target_contenedor = $(target).parents(".board-container").prev().text();
			}
			else if($(target).hasClass("board-item")) {
				$(target).before(document.getElementById(item_id));
				target_contenedor = $(target).parent().prev().text();
			}
			else if ($(target).hasClass("board-container")) {
				$(target).append(document.getElementById(item_id));
				target_contenedor = $(target).prev().text();
			}

			// Actualizar si hubo cambio de contenedor
			if (item_contenedor !== target_contenedor) {
				target_contenedor = target_contenedor.replace(" ", "").toLowerCase();
				var descripcion = item.children("p.item-content").text().trim();
				$.ajax("/create_update_item", {
					type: "POST",
					data: {
						id: item_id,
						container: target_contenedor,
						description: descripcion,
						label: label
					},
					success: function(data) {
						console.log("item actualizado");
					}
				});
			}
			e.preventDefault();
		}, false);
		containers[i].addEventListener("dragover", function(e) {
			e.preventDefault();
		}, false);
	}

	var items = document.getElementsByClassName("board-item");
	for (var i = 0; i < items.length; i++) {
		items[i].addEventListener("dragstart", function(e) {
			var data = e.target;
			var contenedor = $(data).parents(".board-container").prev().text();
			e.dataTransfer.setData("id", data.id);
			e.dataTransfer.setData("contenedor", contenedor);
		}, false);
	}

	var add_items = document.getElementsByClassName("add-item");
	$(add_items).click(function(e) {
		e.preventDefault();
		var container = $("<div />");
		container.attr("draggable", "true");
		container.attr("id", "");
		container.addClass("board-item alert alert-default");
		container.append("<p class='item-content'/>");

		var labels_container = $("<div />");
		labels_container.css("margin-top", "-18px");
		labels_container.css("font-size", "1.3em");
		labels_container.addClass("labels-container pull-right");

		var label_button = $("<a />");
		label_button.addClass("item-label");
		label_button.css("display", "none");

		var span = $("<span />");
		span.addClass("glyphicon glyphicon-bookmark");

		label_button.append(span);

		var label = label_button.clone();
		label.addClass("default selected");
		labels_container.append(label);

		label = label_button.clone();
		label.addClass("success");
		labels_container.append(label);

		label = label_button.clone();
		label.addClass("info");
		labels_container.append(label);

		label = label_button.clone();
		label.addClass("warning");
		labels_container.append(label);

		label = label_button.clone();
		label.addClass("danger");
		labels_container.append(label);
		labels_container.append("<div class='clearfix' />");

		container.prepend(labels_container);

		var actions = $("<p class='actions pull-right'/>");

		var edit = $("<button />");
		edit.attr("type", "submit");
		edit.attr("data-target", "");
		edit.attr("data-toggle", "tooltip");
		edit.attr("title", "Editar");
		edit.addClass("btn btn-xs btn-primary edit-item");
		edit.append("<span class='glyphicon glyphicon-pencil'/>");
		edit.css("display", "none");
		edit.css("margin-right", "0.4em");
		actions.append(edit);

		var del = $("<button />");
		del.attr("type", "submit");
		del.attr("data-target", "");
		del.attr("data-toggle", "tooltip");
		del.attr("title", "Eliminar");
		del.addClass("btn btn-xs btn-default del-item");
		del.append("<span class='glyphicon glyphicon-trash'/>");
		del.css("display", "none");
		actions.append(del);

		container.append(actions);
		container.append("<div class='clearfix' />");

		container.mouseover(function(e) {
			labels_container.find(".item-label").css("display", "inline");
			edit.css("display", "inline");
			del.css("display", "inline");
		});

		container.mouseleave(function(e) {
			labels_container.find(".item-label").css("display", "none");
			edit.css("display", "none");
			del.css("display", "none");
		});

		edit.tooltip({placement: "bottom"});
		del.tooltip({placement: "bottom"});

		labels_container.find(".item-label").click(function(e) {
			actualizarLabel(e, this);
		});

		edit.click(function(e) {
			editar(e, this);
		});

		del.click(function(e) {
			eliminar(e, this);
		});

		$(this).parents(".panel-info").children(".board-container").append(container);
		edit.click();

	});

	$(items).find("button").css("display", "none");
	$(items).find(".edit-item").css("margin-right", "0.4em");
	$(items).find(".item-label").css("display", "none");

	$(items).find(".item-label").click(function(e) {
		actualizarLabel(e, this);
	});

	$(items).mouseover(function(e) {
		$(this).find("button").css("display", "inline");
		$(this).find(".item-label").css("display", "inline");
	});

	$(items).mouseleave(function(e) {
		$(this).find("button").css("display", "none");
		$(this).find(".item-label").css("display", "none");
	});

	$(items).find("button").tooltip({placement: "bottom"});

	$(items).find(".del-item").click(function(e) {
		eliminar(e, this);
	});

	$(items).find(".edit-item").click(function(e) {
		editar(e, this);
	});

	function eliminar(e, self) {
		if (confirm("El item será eliminado")) {
			var container = $(self).parents(".board-item");
			$.ajax("/delete_item", {
				type: "POST",
				data: {id: container.attr("id")},
				success: function(data) {
					console.log(data);
					container.remove();
				},
				error: function(err) {
					console.log(err);
					container.remove();
				}
			});
		}
	}

	function editar(e, self) {
		console.log("editar");
		var container = $(self).parents(".board-item");
		var labels_container = container.children(".labels-container");
		if (!container.find("textarea").length) {
			var textarea = $("<textarea class='form-control'/>");
			var content = $(self).parents(".board-item").find(".item-content");
			textarea.val(content.text());
			labels_container.after(textarea);
			content.hide();

			textarea.focus();

			textarea.keydown(function(e) {
				var code = (e.which ? e.which : e.keyCode);
				var label = labels_container.children(".item-label.selected").get(0).className.split(" ")[1];
				// Esc
				if (code === 27) {
					console.log("cancelar");
					content.show();
					if (!content.text()) {
						if (!container.attr("id")) {
							container.remove();
						}
					}
					textarea.remove();
				}

				// Enter
				if (code === 13) {
					var id = container.attr("id");
					content.text(textarea.val().trim());
					if (!textarea.val()) {
						if (id) {
							console.log("Eliminar item - item vacío");
							$.ajax("/delete_item", {
								type: "POST",
								data: {id: container.attr("id")},
								success: function(data) {
									console.log(data);
									container.remove();
								},
								error: function(err) {
									console.log(err);
									container.remove();
								}
							});
						}
						container.remove();
					}
					else {
						if (id) {
							console.log("guardar cambios");
							var board_container = container.parent().prev().text().replace(" ", "").toLowerCase();
							var item = {
								id: id,
								container: board_container,
								description: textarea.val().trim(),
								label: label
							};

							$.ajax("/create_update_item", {
								type: "POST",
								data: item,
								success: function(data) {
									console.log("item actualizado");
								},
								error: function(err) {
									console.log(err);
									container.remove();
								}
							});

						}
						else {
							console.log("crear item");
							// todo, doing, done
							var board_container = container.parent().prev().text().replace(" ", "").toLowerCase();
							var item = {
								board_id: extra.board_id,
								container: board_container,
								description: textarea.val().trim(),
								label: label
							};
							$.ajax("/create_update_item", {
								type: "POST",
								data: item,
								success: function(data) {
									container.attr("id", data.id);
									container.get(0).addEventListener("dragstart", function(e) {
										var data = e.target;
										var contenedor = $(data).parents(".board-container").prev().text();
										e.dataTransfer.setData("id", data.id);
										e.dataTransfer.setData("contenedor", contenedor);
									}, false);
								},
								error: function() {
									console.log("error item no creado");
									container.remove();
								}
							});
						}
					}
					textarea.remove();
					content.show();
				}
			});

			// Equivalente a cancelar
			textarea.focusout(function(e) {
				console.log("cancelar");
				content.show();
				if (!content.text()) {
					if (!container.attr("id")) {
						container.remove();
					}
				}
				textarea.remove();
			});
		}
	}

	function actualizarLabel(e, self) {
		var container = $(self).parents(".board-item");
		var label = "";
		if ($(self).hasClass("default")) {
			if(!container.hasClass("alert-default")) {
				container.removeClass("alert-success alert-info alert-warning alert-danger");
				container.addClass("alert-default");
				label = "default";
			}
		}
		if ($(self).hasClass("success")) {
			if(!container.hasClass("alert-success")) {
				container.removeClass("alert-default alert-info alert-warning alert-danger");
				container.addClass("alert-success");
				label = "success";
			}
		}
		if ($(self).hasClass("info")) {
			if(!container.hasClass("alert-info")) {
				container.removeClass("alert-default alert-success alert-warning alert-danger");
				container.addClass("alert-info");
				label = "info";
			}
		}
		if ($(self).hasClass("warning")) {
			if(!container.hasClass("alert-warning")) {
				container.removeClass("alert-default alert-info alert-success alert-danger");
				container.addClass("alert-warning");
				label = "warning";
			}
		}
		if ($(self).hasClass("danger")) {
			if(!container.hasClass("alert-danger")) {
				container.removeClass("alert-default alert-info alert-success alert-warning");
				container.addClass("alert-danger");
				label = "danger";
			}
		}

		if(!$(self).hasClass("selected")) {
			$(self).siblings(".item-label").each(function() {
				$(this).removeClass("selected");
			});
			$(self).addClass("selected");
		}

		if (container.attr("id") && label) {
			// Actualizar item
			var panel = container.parent().prev().text().replace(" ", "").toLowerCase();
			var description = container.children(".item-content").text();

			var item = {
				id: container.attr("id"),
				board_id: extra.board_id,
				container: panel,
				description: description,
				label: label
			}

			$.ajax("/create_update_item", {
				type: "POST",
				data: item,
				success: function(data) {
					console.log("item actualizado");
				},
				error: function(err) {
					console.log(err);
				}
			});
		}
		e.preventDefault();
	}
})();
