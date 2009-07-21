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

var gPrefs = null;

function Init()
{
  dump("init\n");
}

function About()
{
  dump("About");
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
  var wmed = wm.QueryInterface(Components.interfaces.nsIWindowMediator);

  var win = wmed.getMostRecentWindow("navigator:browser");
  win.diGlazoom.openAboutPage(false);
  window.close();
}

function StorePrefs()
{
  var prefs = GetPrefs();

  dump("StorePrefs");
  dump(prefs);
  
  try {
    var value = prefs.getCharPref("toolkit.zoomManager.zoomValues");
    var valueArray = value.split(",");
    var min = 1000, max = 0;
    for (var i = 0; i < valueArray.length; i++)
    {
      var v = parseFloat(valueArray[i])
      min = Math.min(min,v);
      max = Math.max(max, v); 
    }
    prefs.setIntPref("zoom.minPercent", min*100);
    prefs.setIntPref("zoom.maxPercent", max*100);
    var z = opener.ZoomManager ? opener.ZoomManager :
              opener.opener.ZoomManager;
    valueArray.sort();
    z.fullZoomValues = valueArray; 
  }
  catch(e) {}
}

function GetPrefs()
{
  dump("GetPrefs");
  if (gPrefs)
    return gPrefs;

  try {
    gPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefBranch);
  } catch (e) {
    gPrefs = null;
  }

  return gPrefs;
}

function ToggleAutoZoom(aElt)
{
  dump("GetPrefs");
  var e = document.getElementById("autoZoomValue");
  if (aElt.value == "2")
    e.removeAttribute("disabled");
  else
    e.setAttribute("disabled", "true");
}
