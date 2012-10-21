$(document).ready(function() {
	
	// Start from scratch on page load
	if(window.location.hash) {
		window.location = "index.html";
	}
	
	// Feature tests and settings
	var hasLocalStorage = "localStorage" in window,
		maxHistory = 10;
	
	// List of elements we'll use
	var $locationForm = $("#locationForm"),
		$locationInput = $("#locationInput"),
		
		$prevLocationsContainer = $("#prevLocationsContainer"),
		
		$tweetsHeadTerm = $("#tweetsHeadTerm"),
		$tweetsList = $("#tweetsList");
		
	// Hold last request jqXHR's so we can cancel to prevent multiple requests
	var lastRequest;
	
	// Create an application object
	app = {
		
		// App initialization
		init: function() {
			var self = this;
			
			// Focus on the search box
			focusOnLocationBox();
			
			// Add the form submission event
			$locationForm.on("submit", onFormSubmit);
			
			// Show history if there are items there
			this.history.init();
			
			// When the back button is clicked in the tweets pane, reset the form and focus
			$("#tweetsBackButton").on("click", function(e) {
				$locationInput.val("");
				setTimeout(focusOnLocationBox, 1000);
			});
			
			// Geolocate! 
			geolocate();
			
			// When the tweets pane is swipe, go back to home
			$("#tweets").on("swiperight", function() {
				window.location.hash = "";
			});
			
			// Clear history when button clicked
			$("#clearHistoryButton").on("click", function(e) {
				e.preventDefault();
				localStorage.removeItem("history");
				self.history.hideList();
			})
		},
		
		// History modules
		history: {
			$listNode: $("#prevLocationsList"),
			$blockNode: $("#homePrev"),
			init: function() {
				var history = this.getItemsFromHistory(),
					self = this;
				
				// Add items to the list
				if(history.length) {
					history.forEach(function(item) {
						self.addItemToList(item);
					});
					self.showList();
				}
				
				// Use event delegation to look for list items clicked
				this.$listNode.delegate("a", "click", function(e) {
					$locationInput.val(e.target.textContent);
					onFormSubmit();
				});
			},
			getItemsFromHistory: function() {
				var history = "";
				
				if(hasLocalStorage) {
					history = localStorage.getItem("history");
				}
				
				return history ? JSON.parse(history) : [];
			},
			addItemToList: function(text, addToTop) {
				var $li = $("<li><a href='#'>" + text + "</a></li>"),
					listNode = this.$listNode[0];
					
				if(addToTop && listNode.childNodes.length) {
					$li.insertBefore(listNode.childNodes[0]);
				}
				else {
					$li.appendTo(this.$listNode);
				}
				
				this.$listNode.listview("refresh");
			},
			addItemToHistory: function(text, addListItem) {
				var currentItems = this.getItemsFromHistory(),
					newHistory = [text],
					self = this,
					found = false;
				
				// Cycle through the history, see if this is there
				$.each(currentItems, function(index, item) {
					if(item.toLowerCase() != text.toLowerCase()) {
						newHistory.push(item);
					}
					else {
						// We've hit a "repeater"; signal to remove from list
						found = true;
						self.moveItemToTop(text);
					}
				});
				
				// Add a new item to the top of the list
				if(!found && addListItem) {
					this.addItemToList(text, true);
				}
				
				// Limit history to 10 items
				if(newHistory.length > maxHistory) {
					newHistory.length = maxHistory;
				}
				
				// Set new history
				if(hasLocalStorage) {
					// Wrap in try/catch block to prevent mobile safari issues with private browsing
					// http://frederictorres.blogspot.com/2011/11/quotaexceedederr-with-safari-mobile.html
					try {
						localStorage.setItem("history", JSON.stringify(newHistory));
					}
					catch(e){}
				}
				
				// Show the list
				this.showList();
			},
			showList: function() {
				$prevLocationsContainer.addClass("fadeIn");
				this.$listNode.listview("refresh");
			},
			hideList: function() {
				$prevLocationsContainer.removeClass("fadeIn");
			},
			moveItemToTop: function(text) {
				var self = this,
					$listNode = this.$listNode;
				
				$listNode.children().each(function() {
					if($.trim(this.textContent.toLowerCase()) == text.toLowerCase()) {
						$listNode[0].removeChild(this);
						self.addItemToList(text, true);
					}
				});
				
				$listNode.listview("refresh");
			}
		}
		
	};
	
	// Search submission
	function onFormSubmit(e) {
		if(e) e.preventDefault();
		
		// Trim the value
		var value = $.trim($locationInput.val());
		
		// Move to the tweets pane
		if(value) {
			
			// Add the search to history
			app.history.addItemToHistory(value, true);
			
			// Update the pane 2 header
			$tweetsHeadTerm.html(value);
			
			// If there's another request at the moment, cancel it
			if(lastRequest && lastRequest.readyState != 4) {
				lastRequest.abort();
			}
			
			// Make the JSONP call to Twitter
			lastRequest = $.ajax("http://search.twitter.com/search.json", {
				cache: false,
				crossDomain: true,
				data: {
					q: value
				},
				dataType: "jsonp",
				jsonpCallback: "twitterCallback",
				timeout: 3000
			});
		}
		else {
			// Focus on the search box
			focusOnLocationBox();
		}
		
		return false;
	}

	// Google GeoCode reception
	window.geocodeCallback = function(json) {
		// Make the JSONP call to Twitter
		console.log(json.query);
		if(json.query.count) {
			$locationInput.val(json.query.results.json[0].results.address_components[3].long_name);
		}
	};
	
	// Twitter reception
	window.twitterCallback = function(json) {
		
		var template = "<li><img src='{profile_image_url}' class='tweetImage' /><div class='tweetContent'><strong>{from_user}</strong>{text}</div><div class='clear'></div></li>",
			tweetHTMLs = [];
			
		// Basic error handling
		if(json.error) { // Error for twitter
			showDialog("Twitter Error", "Twitter cannot provide tweet data.");
			return;
		}
		else if(!json.results.length) { // No results
			showDialog("Twitter Error", "No tweets could be found in your area.");
			return;
		}
		
		// Format the tweets
		$.each(json.results, function(index, item) {
			item.text = item.text.
						replace(/(https?:\/\/\S+)/gi,'<a href="$1" target="_blank">$1</a>').
						replace(/(^|\s)@(\w+)/g,'$1<a href="http://twitter.com/$2" target="_blank">@$2</a>').
						replace(/(^|\s)#(\w+)/g,'$1<a href="http://search.twitter.com/search?q=%23$2" target="_blank">#$2</a>')
			tweetHTMLs.push(substitute(template, item));
		});
		
		// Place tweet data into the form
		$tweetsList.html(tweetHTMLs.join(""));
		
		// Refresh the list view for proper formatting
		try {
			$tweetsList.listview("refresh");
		}
		catch(e) {}
		
		// Go to the tweets view
		window.location.hash = "tweets";
	};
	
	// Template substitution
	function substitute(str, obj) {
		return str.replace((/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (obj[name] != null) ? obj[name] : "";
		});
	}
	
	// Geolocates the user
	function geolocate() {
		if("geolocation" in navigator) {
			// Attempt to get the user position
			navigator.geolocation.getCurrentPosition(function(position) {
				// Set the address position 
				if(position.coords.latitude != undefined && position.coords.longitude != undefined) {

					var query = encodeURIComponent("SELECT results FROM json WHERE url='maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude + "&sensor=true'"),
						url = "http://query.yahooapis.com/v1/public/yql?q=" + query + "&format=json&callback=geocodeCallback";

					// Make the JSONP call to Twitter
					lastRequest = $.ajax(url, {
						cache: false,
						crossDomain: true,
						dataType: "jsonp",
						callback: "geocodeCallback",
						timeout: 3000
					});
				}
			});
		}
	}
	
	// Focuses on the input box
	function focusOnLocationBox() {
		$locationInput[0].focus();
	}
	
	// Modal function
	function showDialog(title, message) {
		$("#errorDialog h2.error-title").html(title);
		$("#errorDialog p.error-message").html(message);
		$.mobile.changePage("#errorDialog");
	}
	
	// Init the app
	app.init();
	
});