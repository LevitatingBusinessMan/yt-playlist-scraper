### How this scraper works
##### Initial request
First this scraper makes a request to `https://www.youtube.com/playlist?list=$ID`, but this is already where it gets tricky, because there are 2 possible responses for that request. Only when requesting with a User-Agent header set will youtube respond the same way as it does in the browser, we need this response because it contains a piece of json  (an object called ytInitialData) inside the html which we can parse to get all the video data without having to rely on the HTML itself.
This however only fetches us the first 100 videos
##### Fetching more
To fetch 100 more we need to make a request to `https://www.youtube.com/browse_ajax?continuation=$TOKEN` where the continuation token is a variable that can be found inside the ytInitialData object. The exact place is shown below. This request also has 2 possible responses and to get the same json response the browser receives two specific headers have to be set. Those are `x-youtube-client-name` and
`x-youtube-client-version`. The values of which can be found in various places in the html of the initial request. The client name should be `1` and the version should like something like `2.20200609.04.01`. To fetch another 100 make the same request but with the continuation token found in this response.

```
ytData
					.contents
					.twoColumnBrowseResultsRenderer
					.tabs[0]
					.tabRenderer
					.content
					.sectionListRenderer
					.contents[0]
					.itemSectionRenderer
					.contents[0]
					.playlistVideoListRenderer
					.continuations[0]
					
					// Check if this exists
					.nextContinuationData
					.continuation
```
