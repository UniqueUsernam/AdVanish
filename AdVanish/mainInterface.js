// Support script for main.html, the main AdVanish interface. This script provides the Open Disable Page functionality.
document.addEventListener("DOMContentLoaded", function () {
	document.getElementById("disable").addEventListener("click", function () {
		extensionID = chrome.runtime.id;
		chrome.tabs.create({ url: "chrome://extensions/?id=" + extensionID });
	});
})