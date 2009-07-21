function Donate()
{
  var bundle = document.getElementById("bundle");
  var url = bundle.getString("DonateURL");
  OpenURL(url);
}

function OpenURL(aURL)
{
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
	var windowMediator = wm.QueryInterface(Components.interfaces.nsIWindowMediator);
	
	var win = windowMediator.getMostRecentWindow("navigator:browser");
	if (!win)
	    win = window.openDialog("chrome://browser/content/browser.xul", "_blank", "chrome,all,dialog=no", aURL, null, null);
	else
  {
	    var content = win.document.getElementById("content");
	    content.selectedTab = content.addTab(aURL);    
	}
}
