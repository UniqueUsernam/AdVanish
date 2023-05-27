//Set up navigation back to the original website with URL parameters passed in by content.js
const queryString = location.search;
const urlParameters = new URLSearchParams(queryString);
const backURL = decodeURIComponent(urlParameters.get("back"));
const shortBackURL = decodeURIComponent(urlParameters.get("short"));
var unblockedURL = "";
if (backURL.includes('?')) {
	unblockedURL = backURL + "&unblockedByAdVanish=true";
}
else {
	unblockedURL = backURL + "?unblockedByAdVanish=true";
}
if (backURL === "null" || shortBackURL === "null") {
	alert("An error has ocurred loading the page yellowlisted.html: missing URL parameters.");
}
else {
	document.addEventListener("DOMContentLoaded", function() {
		document.getElementById("content").hidden = false;
	})
}
document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("shortURL").textContent = shortBackURL;
	document.getElementById("backlink").href = unblockedURL;
})