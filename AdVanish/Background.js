chrome.runtime.onInstalled.addListener(function (object) {
    let internalUrl = chrome.runtime.getURL("installed.html");

    if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: internalUrl }, function (tab) {
            console.log("AdVanish has been installed!");
        });
    }
});
function fetchFailure() {
  if (confirm("AdVanish: an error has occurred. Check your network connection and reload the page.")) {
    location.reload()
  }
}
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.contentScriptQuery === "queryRedlist") {
      var url = "https://raw.githubusercontent.com/anudeepND/blacklist/master/adservers.txt";
      fetch(url)
        .then(response => response.text())
        .then(text => sendResponse(text))
        .catch(error => fetchFailure())
      return true;  // Responds asynchronously.
    }
    else if (request.contentScriptQuery === "removeBadge") {
      chrome.action.setBadgeText({text: ""});
    }
});
