//Broadcast a message so Background.js can add a badge to the AdVanish icon and add "This page is blocked" text to popup
console.log("AdVanish: resource blocked");
chrome.action.setBadgeBackgroundColor(
  {color: 'orange'},
  () => { /* ... */ },
);
chrome.action.setBadgeText({text: "1"});
/*setTimeout(function() {
  alert("bad stuff has happened.")
}, 100);*/
