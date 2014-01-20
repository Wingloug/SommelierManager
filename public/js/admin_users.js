$(function() {
	var options = {
		valueNames: [ 'username' , 'email', 'role' ]
	}

	var userList = new List('users', options)

	$(".form-inline button").click(function() {
		$(this).prev().val("");
		userList.search();
	});

	$(".sorters a").click(function() {
		if ($(this).hasClass("sortAsc")) {
			userList.sort($(this).attr("data-sort"), { desc: true } );
		}
		else {
			userList.sort($(this).attr("data-sort"), { desc: false });
		}

		$("a.sortAsc, a.sortDesc").removeClass("active");
		$(this).addClass("active");
	})
});
