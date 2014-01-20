$(function() {
	$(document).ready(function() {
		$("#projects_table").find("tr td:nth-child(4)").each(function() {
			var url = "/username/" + $(this).attr("data-user");
			var td = $(this);
			$.post(url, null, function(data) {
				td.text(data);
			});
		})
	})

	var options = {
		valueNames: [ 'name' , 'progreso', 'status' , 'username']
	}

	var projectList = new List('projects', options)

	$(".form-inline button").click(function() {
		$(this).prev().val("");
		projectList.search();
	});

	$(".sorters a").click(function() {
		if ($(this).hasClass("sortAsc")) {
			projectList.sort($(this).attr("data-sort"), { desc: true } );
		}
		else {
			projectList.sort($(this).attr("data-sort"), { desc: false });
		}

		$("a.sortAsc, a.sortDesc").removeClass("active");
		$(this).addClass("active");
	});
});
