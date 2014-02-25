$(function() {
	var options = {
		valueNames: [ 'name' , 'progreso', 'status' , 'username'],
		page: 8,
		plugins: [ ListPagination({}) ]
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

	$(document).ready(function() {
		if ($(".pagination").children().length === 1) {
			$(".pagination").hide();
		}
	});
});
