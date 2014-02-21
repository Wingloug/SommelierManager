(function() {
	$("#parent").change(function() {
		var project = $(this).children("option:selected").attr("data-project");
		var branch = $(this).children("option:selected").attr("data-branch");

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
})();
