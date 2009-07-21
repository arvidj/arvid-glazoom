

var GlazoomElementPinger = {

	mDocument: null,
	mHighlightElement: null,
	mOldStyles: "",
	mInspectMode: false,

	cancelInspection: function(aNotif, aDesc)
	{
		GlazoomElementPinger.shutdown();
	},
	
	inspect: function(aDocument)
	{
		var notifBox = getBrowser().getNotificationBox();
		var bundle = document.getElementById("creatorString");
		var buttons = [ { label: bundle.getString("cancel"),
                      accessKey: bundle.getString("cancelAccessKey"),
                      callback: this.cancelInspection,
                      popup: null} ];
		notifBox.appendNotification(bundle.getString("cancelInspectionNotifLabel"),
		                            "GlazoomInspectDocument",
		                            "chrome://glazoom/skin/glazoom.png",
		                            notifBox.PRIORITY_INFO_HIGH,
		                            buttons);
		this.mDocument = aDocument;

		aDocument.addEventListener("mouseover", this.onMouseOver, true);
    aDocument.addEventListener("click",     this.onClick, true);

    this.mInspectMode = true;
	},

	shutdown: function()
	{
    var notifBox = getBrowser().getNotificationBox();
    var notif = notifBox.getNotificationWithValue("GlazoomInspectDocument")
    if (notif)
      notif.close();

    if (!this.mDocument || !this.mInspectMode)
		  return;
    this.mDocument.removeEventListener("mouseover", this.onMouseOver, true);
    this.mDocument.removeEventListener("click", this.onClick, true);
    if (this.mHighlightElement)
    {
      this.mHighlightElement.setAttribute("style", this.mOldStyles);
    }
    this.mDocument = null;
    this.mInspectMode = false;
	},

	getComputedDisplay: function(aElt)
	{
		var doc = aElt.ownerDocument;
		return doc.defaultView.getComputedStyle(aElt, "").getPropertyValue("display");
	},

	getContainer: function(aElt)
	{
    var elt = aElt;
    var d = GlazoomElementPinger.getComputedDisplay(elt);
    while (elt && d == "inline")
    {
      elt = elt.parentNode;
      d = GlazoomElementPinger.getComputedDisplay(elt);
    }
    return elt;
	},

	onMouseOver: function(aEvent) {

  	var elt = GlazoomElementPinger.getContainer(aEvent.target);
  	
    if (GlazoomElementPinger.mHighlightElement)
    {
      if (GlazoomElementPinger.mHighlightElement != elt)
        GlazoomElementPinger.mHighlightElement.setAttribute("style", GlazoomElementPinger.mOldStyles);
      else
        return;
    }

    var name = elt.nodeName.toLowerCase();
    if (name == "html" || name == "body")
    {
    	GlazoomElementPinger.mHighlightElement = null;
    }
    else
    {
      GlazoomElementPinger.mHighlightElement = elt;
      GlazoomElementPinger.mOldStyles = GlazoomElementPinger.mHighlightElement.getAttribute("style");
      GlazoomElementPinger.mHighlightElement.style.outline="1px solid blue";
      GlazoomElementPinger.mHighlightElement.style.MozOpacity = "0.5";
      GlazoomElementPinger.mHighlightElement.style.backgroundColor = "silver";
      GlazoomElementPinger.mHighlightElement.style.backgroundImage = "url('chrome://glazoom/skin/glazoom.png')";
      GlazoomElementPinger.mHighlightElement.style.backgroundRepeat = "no-repeat";
      GlazoomElementPinger.mHighlightElement.style.backgroundPosition = "top right";
    }

    aEvent.stopPropagation();
    aEvent.preventDefault();
  },

  onClick: function(aEvent) {
      var node = GlazoomElementPinger.mHighlightElement;
      aEvent.stopPropagation();
      aEvent.preventDefault();
      GlazoomElementPinger.shutdown();
      diGlazoom.zoomNode(node);
  }

};


