(function() {
	setTimeout(function() {
		$(".progress-bar").each(function(index){
			var progress = $(this).css("max-width");
			$(this).css("width", progress);
		});
	}, 500)
})(jQuery);
