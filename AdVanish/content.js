"use strict";

// Request Background.js to remove any badge from the icon that was set on the blocked page because the user navigated off of the blocked page.
chrome.runtime.sendMessage(
  {contentScriptQuery: 'removeBadge'}
)

// Get redlist from https://raw.githubusercontent.com/anudeepND/blacklist/master/adservers.txt through messaging the background script/service worker
var redlist = "";
chrome.runtime.sendMessage(
  {contentScriptQuery: 'queryRedlist'},
   function (response) {
     runContentScript(response);
   });

// The websites below in the yellowlist will display a warning when the user visits them through window.confirm(), allowing them to continue or exit the website.
var yellowlist = ["sumatosoft.com", "splunk.com", "teradata.com", "scnsoft.com", "oracle.com", "krunker.io", "pulsepoint.com", "wordpress.com", "zoho.com", "zoho.eu", "accenture.com", "cloudflare.com", "msn.com", "seattlepi.com", "onetrust.com", "cookiepro.com", "marketingplatform.google.com", "yandex.com", "yandex.ru"]

/** Check if a domain is in the redlist, or if it is a subdomain of something that is. Optionally, isAd() also checks if a domain is in the yellowlist, but this behavior is disabled by default.
   * @param {[string]} src The domain to check.
   * @param {[boolean]} checkYellowlist Specifies whether or not to check if the domain is in the yellowlist as well as if it is in the redlist. Set to false by default.
  */
function isAd(src, checkYellowlist = false) {
  for (let i = 0; i < redlist.length; i++) {
    var adDomain = redlist[i];
    if (src.includes(adDomain)) {
      return true;
    }
  }
  if (checkYellowlist) {
    for (let i = 0; i < yellowlist.length; i++) {
      var adDomain = yellowlist[i];
      if (src.includes(adDomain)) {
        return true;
      }
    }
  }
  return false;
}

function runContentScript(redlistText) {
  redlist = redlistText.split(/\r?\n/);
  redlist = redlist.slice(10)
  redlist = redlist.map(s => s.slice(8))
  let emptyString = redlist.pop();
  // Add a few advertising domains not present in the online list
  redlist.push("cdn.pncloudfl.com");
  redlist.push("pncloudfl.com");
  redlist.push("invitemedia.com");
  redlist.push("advertising.yahooinc.com");
  redlist.push("mediavine.com");
  redlist.push("revive-adserver.com");
  redlist.push("revive-adserver.net");
  redlist.push("2mdn.net");
  redlist.push("safeframe.googlesyndication.com")

  // Check if the current URL the user is visiting is in the redlist, and if so, redirect to a blocked page to prevent first-party profiling and tracking

  for (const item of redlist) {
    if ((location.href).includes(item)) {
      location.replace("chrome-extension://" + chrome.runtime.id + "/blocked.html")
    }
  }

  // Check if current URL is in the yellowlist, and if so, inject a window.confirm() dialog (unless the link is unblocked, meaning the user clicked Back after deciding not to load the site)
  for (const item of yellowlist) {
    const queryString = location.search;
    const urlParameters = new URLSearchParams(queryString);
    const unblocked = decodeURIComponent(urlParameters.get("unblockedByAdVanish"));
    if (unblocked != "true") {
      if ((location.href).includes(item)) {
        if (confirm("AdVanish: you are about to visit a website that may attempt to track you and is on the yellowlist. Some sections of this site may be blocked or restricted. Are you sure you want to continue?")) {
          console.log("AdVanish: user decided to continue to " + location.href + ". Continuing to page...")
        }
        else {
          console.log("AdVanish: user decided not to continue to " + location.href + ". Redirecting...")
          location.assign("chrome-extension://" + chrome.runtime.id + "/yellowlisted.html?back=" + encodeURIComponent(location.href) + "&short=" + encodeURIComponent(location.hostname))
        }
      }
    }
  }

  // Remove advertising iFrames
  var iframes = document.querySelectorAll("iframe");
  for (let i = 0; i < iframes.length; i++) {
    var iframe = iframes[i];
    if (isAd(iframe.src, true) === true) {
      iframe.remove();
    }
  }
  
  // Remove advertising videos
  var videos = document.querySelectorAll("video");
  for (let i = 0; i < videos.length; i++) {
    var video = videos[i];
    if (isAd(video.src, true) === true) {
      video.remove();
    }
    else {
      for (let i = 0; i < video.getElementsByTagName("source").length; i++) {
        if (isAd(video.getElementsByTagName("source")[i].src, true)) {
          video.remove();
        }
      }
    }
  }

  // Remove advertising images
  var images = document.querySelectorAll("img");
  for (let i = 0; i < images.length; i++) {
    var img = images[i];
    if (isAd(img.src, false) === true) {
      img.remove();
    }
    else if (img.alt === "Advertisement") {
      img.remove();
    }
  }

  // Remove certain <div> elements known to contain advertising space to get rid of some of the empty white space that's left behind when ads are removed. This will NOT remove all "ad residue" space, only a small amount of it, but this will help with some page clutter.
  const divs = document.querySelectorAll("div");
  for (let i = 0; i < divs.length; i++) {
    var div = divs[i];
    try {
      if (div.title.toLowerCase() === "advertisement") {
        div.remove();
        continue;
      }
    } catch (error) {}
    try {
      if (div.aria-label.toLowerCase() === "advertisement") {
        div.remove();
        continue;
      }
    } catch (error) {}
    try {
      if (div.className.toLowerCase().replace(/head/g, "").replace(/load/g, "").includes("ad")) {
        div.remove();
        console.log("Class: " + div.className)
        continue;
      }
    } catch (error) {}
    try {
      if (div.id.toLowerCase().replace(/head/g, "").replace(/load/g, "").includes("ad")) {
        div.remove();
        console.log("ID: " + div.id)
        continue;
      }
    } catch (error) {}
    
    try {
      if (div.className.toLowerCase().includes("banner")) {
        div.remove();
        console.log("Class: " + div.className)
        continue;
      }
    } catch (error) {}
    try {
      if (div.id.toLowerCase().includes("banner")) {
        div.remove();
        console.log("ID: " + div.id)
        continue;
      }
    } catch (error) {}
  }
  
  // Remove advertising popups
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the node contains the text "adblock", which covers "adblocker" and "adblocking"
          if ((node.textContent.toUpperCase()).includes("ADBLOCK")) {
            node.remove();
          }
          // Check if the node contains the text "ad block" (with a space)
          else if ((node.textContent.toUpperCase()).includes("AD BLOCK")) {
            node.remove();
          }
          // Check if the node contains the text "subscri", which covers "subscribe" and "subscription"
          else if ((node.textContent.toUpperCase()).includes("SUBSCRI")) {
            node.remove();
          }
          // Check if the node contains the text "buy"
          else if ((node.textContent.toUpperCase()).includes("BUY")) {
            node.remove();
          }
          // Check if the node contains the text "sale"
          else if ((node.textContent.toUpperCase()).includes("SALE")) {
            node.remove();
          }
          // Check if the node contains the text "discount"
          else if ((node.textContent.toUpperCase()).includes("DISCOUNT")) {
            node.remove();
          }
          // Check if the node contains the text "product"
          else if ((node.textContent.toUpperCase()).includes("PRODUCT")) {
            node.remove();
          }
          // Check if the node contains the text "pay"
          else if ((node.textContent.toUpperCase()).includes("PAY")) {
            node.remove();
          }
          // Check if the node contains the text "price"
          else if ((node.textContent.toUpperCase()).includes("PRICE")) {
            node.remove();
          }
          // Check if the node contains the text "purchase"
          else if ((node.textContent.toUpperCase()).includes("PURCHASE")) {
            node.remove();
          }
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Watch for new advertising third-party elements being added to the page, and block them
  const observer2 = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      Array.from(mutation.addedNodes).forEach(node => {
        if (node.src !== undefined) {
          if (isAd(node.src)) {
            node.remove();
          }
        }
        const divs = document.querySelectorAll("div");
        for (let i = 0; i < divs.length; i++) {
          var div = divs[i];
          try {
            if (div.title.toLowerCase() === "advertisement") {
              div.remove();
              continue;
            }
          } catch (error) {}
          try {
            if (div.aria-label.toLowerCase() === "advertisement") {
              div.remove();
              continue;
            }
          } catch (error) {}
          try {
            if (div.className.toLowerCase().replace(/head/g, "").replace(/load/g, "").includes("ad")) {
              div.remove();
              console.log("Class: " + div.className)
              continue;
            }
          } catch (error) {}
          try {
            if (div.id.toLowerCase().replace(/head/g, "").replace(/load/g, "").includes("ad")) {
              div.remove();
              console.log("ID: " + div.id)
              continue;
            }
          } catch (error) {}
          
          try {
            if (div.className.toLowerCase().includes("banner")) {
              div.remove();
              console.log("Class: " + div.className)
              continue;
            }
          } catch (error) {}
          try {
            if (div.id.toLowerCase().includes("banner")) {
              div.remove();
              console.log("ID: " + div.id)
              continue;
            }
          } catch (error) {}
        }
      });
    });
  });

  observer2.observe(document.body, { childList: true, subtree: true });
}