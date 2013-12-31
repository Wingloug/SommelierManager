var Cookie = function(days) {
	this.key = {name: "", value: ""};
}

Cookie.prototype.createCookie = function(keyName, value, days) {
	this.key.name = keyName;
	this.key.value = value;

	var date = new Date();
	if (days) {

		date.setTime(date.getTime() + (days*24*60*60*1000));
	}
	else {
		date.setTime(date.getTime() + (24*60*60*1000));
	}

	this.expires = "; expires=" + date.toGMTString();
	document.cookie = this.key.name + "=" + this.key.value + this.expires + "; path=/";
}

Cookie.prototype.readCookie = function(keyName) {
	this.key.name = name + "=";
	var cookie = document.cookie;

	if (cookie.length > 0) {
		var character = cookie.split(";");
		for (var i=0; i < character.length; i++) {
			var c = character[i];
			while (c.charAt(0) === ' ')
				c = c.substring(1,c.length);
			if (c.indexOf(name) === 0)
				this.value = c.substring(name.length, c.length);
		}
	}
}

Cookie.prototype.deleteCookie = function(keyName) {
	Cookie.createCookie(keyName, "", -1);
}
