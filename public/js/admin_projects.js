$(function() {
	$(document).ready(function() {
		$("#projects").find("tr td:nth-child(4)").each(function() {
			var url = "/username/" + $(this).attr("data-user");
			var td = $(this);
			$.post(url, null, function(data) {
				td.text(data);
			});
		})
	})
});
