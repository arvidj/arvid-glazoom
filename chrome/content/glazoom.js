/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Glazoom extension for Mozilla Firefox.
 *
 * The Initial Developer of the Original Code is
 * DISRUPTIVE INNOVATIONS SARL
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

var diGlazoom = {
  
  kMAX_ZOOM_FACTOR_PREF:    "extensions.glazoom.maxZoomFactor",
  kPREFER_TABLE_CELLS_PREF: "extensions.glazoom.preferTableCells",
  kZOOM_VALUES: "toolkit.zoomManager.zoomValues",
  kBUTTONS_STYLE: "extensions.glazoom.buttonsStyle",
  kVERSIONS: "extensions.glazoom.firstRun.versions",
  kZOOM_MARGIN_PREF: "extensions.glazoom.zoomMargin",

  mPrefs: null,
  
  zoomContextNode: function zoomContextNode()
  {
    // early way out if we don't have a context menu
    if (!gContextMenu)
      return;
    // retrieve the element the user right-clicked on
    var target = gContextMenu.target;
  
    var doit = false;
    if ((gContextMenu.onImage && !gContextMenu.onStandaloneImage) ||
         gContextMenu.onCanvas ||
         gContextMenu.onTextInput)
      doit = true;
    else
    {
      // climb up the tree until we find an element that's not an
      // inline-level element
      while (target &&
             this.getComputedStyle(target, "display") == "inline")
        target = target.parentNode;
      doit = true;
    }
  
    if (doit)
      this.zoomNode(target);
  },

  zoomNode: function(aNode)
  {
    var prefs = this.getPrefs();
    
    // what's the viewport like ?
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;

    var targetForWidth = this.tweakTargetForWidth(aNode);
    // retrieve the size of the element
    var margin = prefs ? prefs.getIntPref(this.kZOOM_MARGIN_PREF) : 0;

    var w = targetForWidth.clientWidth + 16 + margin; // don't forget the scrollbars
    // compute the zoom factor we need to make it fit the best
    // into the viewport
    var ratio = viewportWidth / w;
    var maxRatio = prefs ?
                     prefs.getIntPref(this.kMAX_ZOOM_FACTOR_PREF) / 100 :
                     0;
    
    var docViewer = getBrowser().mCurrentBrowser.markupDocumentViewer;
    // apply zoom factor
    docViewer.fullZoom = (maxRatio > 0) ? Math.min(maxRatio, ratio) : ratio;
    // compute the element's position
    var positionForY = this.getElementPosition(aNode);
    var positionForX = (aNode == targetForWidth) ? positionForY :
                          this.getElementPosition(targetForWidth);
    positionForX.x = margin > 0 ? positionForX.x - margin/2 : positionForX.x;
    //positionForX.x =- margin/2;
    
    // warning, do we need to tweak a bit  
    // scroll to that position
    getBrowser().contentWindow.scrollTo(positionForX.x,
                                        positionForY.y);
    if (ZoomManager.useFullZoom)
      ZoomManager.throwFullZoomChangedEvent();
  },

  tweakTargetForWidth: function tweakTargetForWidth(aElement)
  {
    var res = aElement;
    switch (aElement.nodeName.toLowerCase())
    {
      case "li":
        // do we have a real list here or something looking like a
        // dynamic menu ? If it's a real list, we really care about the
        // list's width, not the item's list
        if (this.getComputedStyle(aElement, "list-style-type") != "none" ||
            this.getComputedStyle(aElement, "list-style-image") != "none")
          res = aElement.parentNode;
      default: break;
    }

    if (this.getPrefs() &&
        this.getPrefs().getBoolPref(this.kPREFER_TABLE_CELLS_PREF))
    {
      var tmpNode = res;
      while (tmpNode)
      {
        if (tmpNode instanceof Components.interfaces.nsIDOMHTMLTableCellElement)
        {
          res = tmpNode;
          break;
        }
        tmpNode = tmpNode.parentNode;
      }
    }
    return res;
  },

  getComputedStyle: function getComputedStyle(aElem, aProp)
  {
    if (aElem.nodeType == Node.ELEMENT_NODE)
      return aElem.ownerDocument
                  .defaultView
                  .getComputedStyle(aElem, "").getPropertyValue(aProp);
  
   return null;
  },

  zoomBack: function zoomBack()
  {
    var docViewer = getBrowser().mCurrentBrowser.markupDocumentViewer;
    // apply zoom factor 1:1
    docViewer.fullZoom = 1;
    if (ZoomManager.useFullZoom)
      ZoomManager.throwFullZoomChangedEvent();
  },

  getElementPosition: function getElementPosition(aElement)
  {
    var x = 0, y = 0;
    var target = aElement;
    while (target)
    {
      x += target.offsetLeft;
      y += target.offsetTop;
      target = target.offsetParent;
    }
    return {x: x, y:y};
  },

  getPrefs: function getPrefs()
  {
    if (this.mPrefs)
      return this.mPrefs;
  
    try {
      this.mPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                              .getService(Components.interfaces.nsIPrefBranch);
    } catch (e) {
      this.mPrefs = null;
    }
  
    return this.mPrefs;
  },

  fillZoomValues: function fillZoomValues(aPopup)
  {
    var values = this.getPrefs() ?
                   this.getPrefs().getCharPref(this.kZOOM_VALUES) :
                   ".5,.75,1,1.25,1.5,2,3";
    var valueArray = values.split(",");
    var child = aPopup.lastChild;
    while (child &&
           child.nodeName.toLowerCase() != "menuseparator")
    {
      var tmp = child.previousSibling;
      aPopup.removeChild(child);
      child = tmp;
    }

    var ratio = ZoomManager.zoom;
    aPopup.parentNode.setAttribute("value", ratio*100 +"%");

    var ms = document.getElementById("menuseparator-zoompanel");
    for (var i = 0; i < valueArray.length; i++)
    {
      var value = Math.floor(parseFloat(valueArray[i]) * 100);
      var item = document.createElement("menuitem");
      item.setAttribute("label", value + "%");
      item.setAttribute("value", value);
      aPopup.insertBefore(item, ms.nextSibling);
    }
  },

  applyZoomValue: function applyZoomValue(aMenulist)
  {
    if (aMenulist.selectedItem && aMenulist.selectedItem.value)
    {
      ZoomManager.zoom = parseInt(aMenulist.selectedItem.value) / 100;
      FullZoom._applySettingToPref();
      getBrowser().contentWindow.focus();
    }
    else
      aMenulist.value = ZoomManager.zoom * 100 + "%";
  },

  applyButtonsStylePref: function()
  {
   var buttonsStyle = this.getPrefs() ?
                         this.getPrefs().getCharPref(this.kBUTTONS_STYLE) :
                         "magglasses";

    var spinbuttons = document.getElementById("zoompanel-spinbuttons");
    var enlargeButton = document.getElementById("diGlazoomEnlarge");
    var reduceButton = document.getElementById("diGlazoomReduce");

    switch(buttonsStyle)
    {
      case "none":
        spinbuttons.setAttribute("hidden", "true");
        enlargeButton.setAttribute("hidden", "true");
        reduceButton.setAttribute("hidden", "true");
        break;
      case "spinbuttons":
        spinbuttons.removeAttribute("hidden");
        enlargeButton.setAttribute("hidden", "true");
        reduceButton.setAttribute("hidden", "true");
        break;
      case "magglasses":
        spinbuttons.setAttribute("hidden", "true");
        enlargeButton.removeAttribute("hidden");
        reduceButton.removeAttribute("hidden");
        break;
      default: break; // never hit
     }
  },

  init: function init()
  {
    window.removeEventListener('load',   diGlazoom.init, false);
    diGlazoom.applyButtonsStylePref();
    setTimeout(diGlazoom.openAboutPage, 1000, true);

    var tb = document.getElementById("content");

    tb.addEventListener("pageshow",   diGlazoom.onPageShow, false);
    tb.addEventListener("TabSelect",  diGlazoom.onTabSelect, false);

    window.addEventListener("FullZoomChanged", diGlazoom.onFullZoomChange, false);
    document.getElementById("contentAreaContextMenu")
        .addEventListener('popupshowing', diGlazoom.updateContextPopup, false);
  },

  openAboutPage: function(aFirstRun)
  {
	  var em = Components.classes["@mozilla.org/extensions/manager;1"]
	             .getService(Components.interfaces.nsIExtensionManager);
	  var item = em.getItemForID("zoomit@disruptive-innovations.com");
	  var version = item.version;
	  var versions = diGlazoom.getPrefs() ?
	                        diGlazoom.getPrefs().getCharPref(diGlazoom.kVERSIONS) :
	                       "";

    if (aFirstRun && versions.indexOf(" " + version + " ") != -1)
      return;

    if (aFirstRun)
      diGlazoom.getPrefs().setCharPref(diGlazoom.kVERSIONS, versions + " " + version + " ");

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
	  var wmed = wm.QueryInterface(Components.interfaces.nsIWindowMediator);
	
	  var win = wmed.getMostRecentWindow("navigator:browser");
	  
	  var content = win.document.getElementById("content");
	  content.selectedTab = content.addTab("chrome://glazoom/content/about.xul");      
  },

  shutdown: function shutdown()
  {
    window.removeEventListener('unload',   diGlazoom.shutdown, false);

    var tb = document.getElementById("content");
  
    tb.removeEventListener("pageshow",   diGlazoom.onPageShow, false);
    tb.removeEventListener("TabSelect",  diGlazoom.onTabSelect, false);
    window.removeEventListener("FullZoomChanged", diGlazoom.onFullZoomChange, false);
    document.getElementById("contentAreaContextMenu")
        .removeEventListener('popupshowing', diGlazoom.updateContextPopup, false);
  },

  onPageShow: function onPageShow(aEvent)
  {
    // find the same-domain policy
    var doApplyPrefToSetting = 0;
    try {
      doApplyPrefToSetting = gPrefService.getIntPref(FullZoom.kAPPLY_PREF_TO_FULLZOOM_SETTING);
    } catch (e) {}

    if (doApplyPrefToSetting == 2)
    {
      var autoZoom = 100;
      try {
        autoZoom = gPrefService.getIntPref("extensions.glazoom.autoZoom");
      }
      catch(e) {}
      ZoomManager.zoom = autoZoom / 100;
      FullZoom._applySettingToPref();
    }
    else
    {
      var ratio = ZoomManager.zoom;
      document.getElementById("menulist-zoompanel")
              .value = Math.floor(ratio*100) +"%";
    }
  },

  onTabSelect: function onTabSelect(aEvent)
  {
    var ratio = ZoomManager.zoom;
    document.getElementById("menulist-zoompanel")
            .value = Math.floor(ratio*100) +"%";
  },

  onFullZoomChange: function onFullZoomChange(aEvent)
  {
    var ratio = ZoomManager.zoom;
    document.getElementById("menulist-zoompanel")
            .value = Math.floor(ratio*100) +"%";
    var doApplyPrefToSetting = 0;
    try {
      doApplyPrefToSetting = gPrefService.getIntPref(FullZoom.kAPPLY_PREF_TO_FULLZOOM_SETTING);
    } catch (e) {}
    if (doApplyPrefToSetting == 1)
      FullZoom._applySettingToPref();
  },

  enlarge: function enlarge()
  {
    FullZoom.enlarge();
    //this.onFullZoomChange(null);
  },

  reduce: function reduce()
  {
    FullZoom.reduce();
    //this.onFullZoomChange(null);
  },

	openWindow: function(parent, url, target, features, args, noExternalArgs)
	{
	  var wwatch = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
	                         .getService(Components.interfaces.nsIWindowWatcher);
	
	  var argArray = Components.classes["@mozilla.org/supports-array;1"]
	                    .createInstance(Components.interfaces.nsISupportsArray);
	
    argArray.AppendElement(null);
	
	  return wwatch.openWindow(parent, url, target, features, argArray);
	},

	getMostRecentWindow: function(aType)
	{
	  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
	                     .getService(Components.interfaces.nsIWindowMediator);
	  return wm.getMostRecentWindow(aType);
	},

  openPreferences: function()
  {
	  var features = "chrome,titlebar,toolbar,modal,centerscreen,dialog=no";
	  var url = "chrome://glazoom/content/prefs.xul";
	
	  var win = this.getMostRecentWindow("Glazoom:Preferences");
	  if (win) {
	    win.focus();
	  } else {
	    this.openWindow(null, url, "_blank", features);
	  }
    this.applyButtonsStylePref();
	},

  prefs: function prefs()
  {
    window.openDialog("chrome://glazoom/content/prefs.xul", "",
                      "chrome,centerscreen,dialog");
  },

  updateContextPopup: function updateContextPopup(aEvent)
  {
    var zoomItElt   = document.getElementById("diGlazoomMenuItem");
    var zoomBackElt = document.getElementById("diGlazoomBackMenuItem");
    var fitToWindowElt = document.getElementById("diGlazoomFitToWindowMenuItem"); 
    if (ZoomManager.useFullZoom)
    {
      zoomItElt.removeAttribute("disabled");
      zoomBackElt.removeAttribute("disabled");
      fitToWindowElt.removeAttribute("disabled");
    }
    else
    {
      zoomItElt.setAttribute("disabled", "true");
      zoomBackElt.setAttribute("disabled", "true");
      fitToWindowElt.setAttribute("disabled", "true");
    }
  },

  onKeyUp: function onKeyUp(aEvent)
  {
    if (aEvent.keyCode != 13)
      return;
    ZoomManager.zoom = parseInt(document.getElementById("menulist-zoompanel").value) / 100;
    FullZoom._applySettingToPref();
    getBrowser().contentWindow.focus();
  },

  fitToWindow: function fitToWindow()
  {
    var docViewer = getBrowser().mCurrentBrowser.markupDocumentViewer;
    docViewer.fullZoom = 1;
    docViewer.fullZoom = (getBrowser().contentWindow.outerWidth - 21) / getBrowser().contentDocument.documentElement.scrollWidth;
    ZoomManager.throwFullZoomChangedEvent();
  }
};

FullZoom.kAPPLY_PREF_TO_FULLZOOM_SETTING = "toolkit.zoomManager.applyPrefToSetting"; 

FullZoom.onLocationChange = (function FullZoom_onLocationChange(aURI, aBrowser) {
  if (!aURI)
    return;
  var doApplyPrefToSetting = 0;
  try {
    doApplyPrefToSetting = gPrefService.getIntPref(FullZoom.kAPPLY_PREF_TO_FULLZOOM_SETTING);
  } catch (e) {}
 
  if (doApplyPrefToSetting == 1)
    this._applyPrefToSetting(this._cps.getPref(aURI, this.name), aBrowser);
});


