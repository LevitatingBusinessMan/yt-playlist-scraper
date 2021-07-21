If your project has the ability to use a Youtube API key I recommend using [yt-playlists](https://github.com/LevitatingBusinessMan/yt-playlists) instead.

# YT-PLAYLIST-SCRAPER
This is a utility for getting the data of videos in a youtube playlist.
I made it for my [yt_mp3](https://github.com/LevitatingBusinessMan/yt_mp3) project, which at first used [yt-playlists](https://github.com/LevitatingBusinessMan/yt-playlists) but keeping the API key hidden turned into a hassle.

### Installing
```
npm i yt-playlist-scraper -s
```

### Using
```JS
const playlists = require("yt-playlist-scraper")
playlists("PLc1l1_YXYDH4BoWto9Mds2aaL_bn1lAG_")
.then(playListData => {
	// Do whatever you want
})
```

### Output
You can refer to the [example_output.json](https://github.com/LevitatingBusinessMan/yt-playlist-scraper/blob/master/example_output.json) file to see an example of the data this package outputs.

## How this scraper works

The following text does not include getting through the cookie consent barrier. Although the currently implementation is fairly straightforward I still want to do more research in finding a more efficient way.

##### Initial request
First this scraper makes a request to `https://www.youtube.com/playlist?list=$ID`, but this is already where it gets tricky, because there are 2 possible responses for that request. Only when requesting with a User-Agent header set will youtube respond the same way as it does in the browser, we need this response because it contains a piece of json  (an object called ytInitialData) inside the html which we can parse to get all the video data without having to rely on the HTML itself.
This however only fetches us the first 100 videos
##### Fetching more
Sinds version 1.1.0 of this package the method of fetching more entries has changed.  Now the last entry of the array of videos is a `continuationItemRenderer` instead of a `playlistVideoRenderer`. This contains the continuation token. To get another 100 videos you can then use the token in a POST request to `https://www.youtube.com/youtubei/v1/browse`. The searchparams should contain an api key (I am using a static one currently, because I am unsure where to retrieve it) and the POST data should contain the continuation token and an object called `context` with a lot of properties.
