var HTML_object = function(object) {
	this.object = new Object(object);
}

HTML_object.prototype.hasClass = function(className) {
	var classes = {};
	classes = this.object.className.split(" ");
	for (var x in classes) {
		if (classes[x] == className)
			return true;
	}
	return false;
}

HTML_object.prototype.removeClass = function(className, callback) {
	var classes = {};
	var final_classes = "";
	var remove = false;
	// Verificar si object tiene className
	if (this.hasClass(className)) {
		classes = this.object.className.split(" ");
		for (var x in classes) {
			if (classes[x] != className)
				final_classes += classes[x] + " ";
		}
		this.object.className = final_classes.trim();
		remove =  true;
	}
	else {
		remove = true;
	}

	if (typeof callback == "function") {
		callback();
	}

	return remove;
}

HTML_object.prototype.addClass = function(className) {
	var classes = {};
	var final_classes = "";
	// Verificar si object tiene className
	if (this.hasClass(className)) {
		return true;
	}
	else {
		classes = this.object.className;
		final_classes = classes + " " + className;
		this.object.className = final_classes.trim();
		return true;
	}
}

HTML_object.prototype.toggleClass = function(className_0, className_1) {
	if (this.hasClass(className_0)) {
		// Cambiar por className_1
		this.addClass(className_1);
		this.removeClass(className_0);
		return true;
	}
	else if (this.hasClass(className_1)) {
		// Cambiar por className_0
		this.addClass(className_0);
		this.removeClass(className_1);
		return true;
	}
	else {
		return false;
	}
}

HTML_object.prototype.findChildren = function(className) {
	// Verificar que el elemento tenga hijos
	var children = this.object.getElementsByClassName(className);
	var children_object = [];

	for (var i = 0; i < children.length; i++) {
		children_object[i] = new HTML_object(children[i]);
	}

	return children_object;
}
