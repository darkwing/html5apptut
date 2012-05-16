$(document).ready(function() {
	
	// DEBUG
	window.location.hash = "";
	
	// Feature tests
	var hasLocalStorage = "localStorage" in window;
	
	// List of elements we'll use
	var $locationForm = $("#locationForm"),
		$locationInput = $("#locationInput"),
		
		$prevLocationsContainer = $("#prevLocationsContainer"),
		
		$tweetsHeadTerm = $("#tweetsHeadTerm"),
		$tweetsList = $("#tweetsList");
		
	// Template
	
	
	// Create an application object
	app = {
		
		// App initialization
		init: function() {
			
			// Focus on the search box
			$locationInput[0].focus();
			
			// Add the form submission event
			$locationForm.submit(onFormSubmit);
			
			// Show history if there are items there
			this.history.init();
			
			// When the back button is clicked in the tweets pane, reset the form and focus
			$("#tweetsBackButton").click(function(e) {
				$locationInput.val("");
				setTimeout(function() { $locationInput[0].focus(); }, 1000);
			});
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
				var history = localStorage.getItem("history");
				return JSON.parse(history) || [];
			},
			addItemToList: function(text, addToTop) {
				var $li = $("<li><a href='#'>" + text + "</a></li>"),
					listNode = this.$listNode[0];
				if(addToTop && listNode.childNodes.length) {
					listNode.insertBefore($li[0], listNode.childNodes[0]);
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
				currentItems.forEach(function(item, index) {
					if(item.toLowerCase() != text.toLowerCase()) {
						newHistory.push(item);
					}
					else {
						// We've hit a "repeater"; signal to remove from list
						found = true;
						self.moveItemToTop(text);
					}
				});
				
				// 
				if(!found && addListItem) {
					this.addItemToList(text, true);
				}
				
				// Set new history
				localStorage.setItem("history", JSON.stringify(newHistory));
			},
			showList: function() {
				$prevLocationsContainer.addClass("fadeIn");
				this.$listNode.listview("refresh");
			},
			moveItemToTop: function(text) {
				var listNode = this.$listNode[0],
					lis = this.$listNode[0].childNodes;
				for(var x = 0; x < lis.length; x++) {
					if(lis[x].textContent.toLowerCase() == text.toLowerCase()) {
						listNode.insertBefore(lis[x], lis[0]);
						return;
					}
				}
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
			
			// Make the JSONP call to Twitter
			/*
			$.getJSON(
				"http://search.twitter.com/search.json",
				{ q: value, callback: "twitterCallback" }
			);
			*/
			twitterCallback(tweetData);
		}
		
		return false;
	}
	
	// Twitter reception
	window.twitterCallback = function(twitterData) {
		
		var json = $.parseJSON(twitterData),
			template = "<li><img src='{profile_image_url}' />  <strong>{from_user}</strong><br />{text}</li>",
			tweetHTMLs = [];
		
		// Format the tweets
		$.each(json.results, function(index, item) {
			item.text = item.text.
						replace(/(https?:\/\/\S+)/gi,'<a href="$1" target="_blank">$1</a>').
						replace(/(^|\s)@(\w+)/g,'$1<a href="http://twitter.com/$2" target="_blank">@$2</a>').
						replace(/(^|\s)#(\w+)/g,'$1<a href="http://search.twitter.com/search?q=%23$2" target="_blank">#$2</a>')
			tweetHTMLs.push(substitute(template, item));
		});
		
		// Format links per tweet
		var massHTML = tweetHTMLs.join("");
		$tweetsList.html(massHTML);
		
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
			return (obj[name] != null) ? obj[name] : '';
		});
	}
	
	
	// Init the app
	app.init();
	
	
	
	
	
	
	
	
	tweetData = '{"completed_in":0.029,"max_id":202509023394803700,"max_id_str":"202509023394803712","next_page":"?page=2&max_id=202509023394803712&q=Madison","page":1,"query":"Madison","refresh_url":"?since_id=202509023394803712&q=Madison","results":[{"created_at":"Tue, 15 May 2012 21:21:28 +0000","from_user":"HannaJanee1","from_user_id":266232551,"from_user_id_str":"266232551","from_user_name":"Hanna ","geo":null,"id":202509023394803700,"id_str":"202509023394803712","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2215937918/image_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/2215937918/image_normal.jpg","source":"&lt;a href=&quot;http://twitter.com/#!/download/iphone&quot; rel=&quot;nofollow&quot;&gt;Twitter for iPhone&lt;/a&gt;","text":"@AyeMaddron Hahahaha it was madison! She\'s retarded","to_user":"AyeMaddron","to_user_id":540331854,"to_user_id_str":"540331854","to_user_name":"Alyssa Maddron.","in_reply_to_status_id":202508924757360640,"in_reply_to_status_id_str":"202508924757360640"},{"created_at":"Tue, 15 May 2012 21:21:18 +0000","from_user":"madison_oleary","from_user_id":486912661,"from_user_id_str":"486912661","from_user_name":"Madison O\'leary","geo":null,"id":202508981560807420,"id_str":"202508981560807425","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/1904707290/guCqY9g0_normal","profile_image_url_https":"https://si0.twimg.com/profile_images/1904707290/guCqY9g0_normal","source":"&lt;a href=&quot;http://twitter.com/download/android&quot; rel=&quot;nofollow&quot;&gt;Twitter for Android&lt;/a&gt;","text":"@AddieGil no you wont :(","to_user":"AddieGil","to_user_id":38055924,"to_user_id_str":"38055924","to_user_name":"Addie Ruston","in_reply_to_status_id":202508631894269950,"in_reply_to_status_id_str":"202508631894269953"},{"created_at":"Tue, 15 May 2012 21:21:18 +0000","from_user":"McCurdyIsNerdy","from_user_id":413163171,"from_user_id_str":"413163171","from_user_name":"Curdles&Horan","geo":null,"id":202508980419969020,"id_str":"202508980419969024","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2211766588/JENNETTEANDNIALL_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/2211766588/JENNETTEANDNIALL_normal.jpg","source":"&lt;a href=&quot;http://www.echofon.com/&quot; rel=&quot;nofollow&quot;&gt;Echofon&lt;/a&gt;","text":"Where did the rumour that Madison is pregnant come from?","to_user":null,"to_user_id":0,"to_user_id_str":"0","to_user_name":null},{"created_at":"Tue, 15 May 2012 21:21:15 +0000","from_user":"LifeOf_MADISON","from_user_id":512420719,"from_user_id_str":"512420719","from_user_name":"Everyone ♥\'sMadison","geo":null,"id":202508969590263800,"id_str":"202508969590263808","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2221403688/Y1ou45V1_normal","profile_image_url_https":"https://si0.twimg.com/profile_images/2221403688/Y1ou45V1_normal","source":"&lt;a href=&quot;http://twitter.com/download/android&quot; rel=&quot;nofollow&quot;&gt;Twitter for Android&lt;/a&gt;","text":"@GorgeousRAYA_ lmaooo , don\'t be playing","to_user":"GorgeousRAYA_","to_user_id":380657215,"to_user_id_str":"380657215","to_user_name":"ImStillthatBTCH :*","in_reply_to_status_id":202508858315390980,"in_reply_to_status_id_str":"202508858315390976"},{"created_at":"Tue, 15 May 2012 21:21:03 +0000","from_user":"madison_weimer","from_user_id":357069911,"from_user_id_str":"357069911","from_user_name":"MADISON (;","geo":null,"id":202508919988424700,"id_str":"202508919988424705","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2197452649/image_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/2197452649/image_normal.jpg","source":"&lt;a href=&quot;http://twitter.com/#!/download/iphone&quot; rel=&quot;nofollow&quot;&gt;Twitter for iPhone&lt;/a&gt;","text":"Love my dog more than anything 🐶😘💙💚💜","to_user":null,"to_user_id":0,"to_user_id_str":"0","to_user_name":null},{"created_at":"Tue, 15 May 2012 21:21:03 +0000","from_user":"Madison_Sage","from_user_id":495501030,"from_user_id_str":"495501030","from_user_name":"Madison Sullivan","geo":null,"id":202508919506092030,"id_str":"202508919506092032","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2219250447/l5K2iQyU_normal","profile_image_url_https":"https://si0.twimg.com/profile_images/2219250447/l5K2iQyU_normal","source":"&lt;a href=&quot;http://twitter.com/download/android&quot; rel=&quot;nofollow&quot;&gt;Twitter for Android&lt;/a&gt;","text":"@sydnee_hudson i\'ve already seen it hahaha the cheerleading one dissapointed me...baseball is obviously the best #CleatChaserStatus","to_user":"sydnee_hudson","to_user_id":366781204,"to_user_id_str":"366781204","to_user_name":"Sydnee Hudson","in_reply_to_status_id":202508551632072700,"in_reply_to_status_id_str":"202508551632072706"},{"created_at":"Tue, 15 May 2012 21:21:03 +0000","from_user":"_AshLynnB_","from_user_id":555534966,"from_user_id_str":"555534966","from_user_name":"Ashley Bilby","geo":null,"id":202508919455748100,"id_str":"202508919455748096","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2160492243/us_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/2160492243/us_normal.jpg","source":"&lt;a href=&quot;http://blackberry.com/twitter&quot; rel=&quot;nofollow&quot;&gt;Twitter for BlackBerry®&lt;/a&gt;","text":"@mandel317 @j_madison_ better hope J accepts u again, get in b4 she becomes a huge modeling star, she\'s on her way ☺ #dont4getdalittleppl","to_user":"mandel317","to_user_id":228505434,"to_user_id_str":"228505434","to_user_name":"Mandy Dennis"},{"created_at":"Tue, 15 May 2012 21:21:02 +0000","from_user":"LifeOf_MADISON","from_user_id":512420719,"from_user_id_str":"512420719","from_user_name":"Everyone ♥\'sMadison","geo":null,"id":202508914296750080,"id_str":"202508914296750080","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2221403688/Y1ou45V1_normal","profile_image_url_https":"https://si0.twimg.com/profile_images/2221403688/Y1ou45V1_normal","source":"&lt;a href=&quot;http://blackberry.com/twitter&quot; rel=&quot;nofollow&quot;&gt;Twitter for BlackBerry®&lt;/a&gt;","text":"RT @GorgeousRAYA_: @LifeOf_MADISON than comee here !","to_user":null,"to_user_id":0,"to_user_id_str":"0","to_user_name":null,"in_reply_to_status_id":202508391938138100,"in_reply_to_status_id_str":"202508391938138112"},{"created_at":"Tue, 15 May 2012 21:21:02 +0000","from_user":"77square","from_user_id":15988683,"from_user_id_str":"15988683","from_user_name":"77 Square","geo":null,"id":202508914015744000,"id_str":"202508914015744000","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/1695419542/77_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/1695419542/77_normal.jpg","source":"&lt;a href=&quot;http://dlvr.it&quot; rel=&quot;nofollow&quot;&gt;dlvr.it&lt;/a&gt;","text":"Surround Sound: Local Q&amp;A: Bello http://t.co/zj914090","to_user":null,"to_user_id":0,"to_user_id_str":"0","to_user_name":null},{"created_at":"Tue, 15 May 2012 21:20:58 +0000","from_user":"madison_walk","from_user_id":335037906,"from_user_id_str":"335037906","from_user_name":"madison","geo":null,"id":202508899293741060,"id_str":"202508899293741056","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/1840375367/sr6TKkFn_normal","profile_image_url_https":"https://si0.twimg.com/profile_images/1840375367/sr6TKkFn_normal","source":"&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;","text":"An amazing new weight loss product! It worked for me and I didnt even change my diet! http://t.co/aCYhUEs8","to_user":null,"to_user_id":0,"to_user_id_str":"0","to_user_name":null},{"created_at":"Tue, 15 May 2012 21:20:56 +0000","from_user":"LlangstonHughes","from_user_id":177059018,"from_user_id_str":"177059018","from_user_name":"BrotherHoodCoven","geo":null,"id":202508888174641150,"id_str":"202508888174641152","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/1897556486/profile_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/1897556486/profile_normal.jpg","source":"&lt;a href=&quot;http://www.tweetcaster.com&quot; rel=&quot;nofollow&quot;&gt;TweetCaster for Android&lt;/a&gt;","text":"@Madison_Avenuue smh","to_user":"Madison_Avenuue","to_user_id":365670917,"to_user_id_str":"365670917","to_user_name":"Chulα ❤","in_reply_to_status_id":202507441856983040,"in_reply_to_status_id_str":"202507441856983041"},{"created_at":"Tue, 15 May 2012 21:20:55 +0000","from_user":"Madison_Bee","from_user_id":53811014,"from_user_id_str":"53811014","from_user_name":"Ashley Bivins","geo":null,"id":202508886144589820,"id_str":"202508886144589824","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2171863966/image_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/2171863966/image_normal.jpg","source":"&lt;a href=&quot;http://twitter.com/#!/download/iphone&quot; rel=&quot;nofollow&quot;&gt;Twitter for iPhone&lt;/a&gt;","text":"4:20 🍁","to_user":null,"to_user_id":0,"to_user_id_str":"0","to_user_name":null},{"created_at":"Tue, 15 May 2012 21:20:53 +0000","from_user":"MOJO_2KOOL","from_user_id":180265195,"from_user_id_str":"180265195","from_user_name":"Ray\'vonn Tra\'vell","geo":null,"id":202508876648677380,"id_str":"202508876648677377","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/1719233870/byrdtwit_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/1719233870/byrdtwit_normal.jpg","source":"&lt;a href=&quot;http://mobile.twitter.com&quot; rel=&quot;nofollow&quot;&gt;Mobile Web&lt;/a&gt;","text":"Chilling With Brandon Hines, Quez Madison, And Lil Munchy!","to_user":null,"to_user_id":0,"to_user_id_str":"0","to_user_name":null},{"created_at":"Tue, 15 May 2012 21:20:48 +0000","from_user":"GorgeousRAYA_","from_user_id":380657215,"from_user_id_str":"380657215","from_user_name":"ImStillthatBTCH :*","geo":null,"id":202508858315390980,"id_str":"202508858315390976","iso_language_code":"en","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2204896246/IMG00187-20120317-1529_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/2204896246/IMG00187-20120317-1529_normal.jpg","source":"&lt;a href=&quot;http://blackberry.com/twitter&quot; rel=&quot;nofollow&quot;&gt;Twitter for BlackBerry®&lt;/a&gt;","text":"@LifeOf_MADISON than comee here !","to_user":"LifeOf_MADISON","to_user_id":512420719,"to_user_id_str":"512420719","to_user_name":"Everyone ♥\'sMadison","in_reply_to_status_id":202508391938138100,"in_reply_to_status_id_str":"202508391938138112"},{"created_at":"Tue, 15 May 2012 21:20:45 +0000","from_user":"Liteskindia","from_user_id":170058536,"from_user_id_str":"170058536","from_user_name":"India Marsh","geo":null,"id":202508843845029900,"id_str":"202508843845029889","iso_language_code":"nl","metadata":{"result_type":"recent"},"profile_image_url":"http://a0.twimg.com/profile_images/2199382264/profile_normal.jpg","profile_image_url_https":"https://si0.twimg.com/profile_images/2199382264/profile_normal.jpg","source":"&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;","text":"@candylady10 idk where to start....with madison ! smh ; we need a dime ; or a dub even !","to_user":"candylady10","to_user_id":111095589,"to_user_id_str":"111095589","to_user_name":"Belle-Femme","in_reply_to_status_id":202508543637721100,"in_reply_to_status_id_str":"202508543637721088"}],"results_per_page":15,"since_id":0,"since_id_str":"0"}';
	
});