const https = require("https"),
	util = require("./util/index.js")

const getPlaylist = ID => new Promise((resolve, reject) => {
	
	if (!ID)
		reject(Error("No ID specified"))
	
	const url = new URL("https://www.youtube.com")
	url.pathname = "/playlist"
	url.searchParams.append("list", ID)

	// Without the deskopt user agent yt will not send its ytInitialData block of JSON
	https.get(url,
		{
			headers: {
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36"
			}
		}, res => {
		
		const { statusCode } = res
		
		if (statusCode != 200) {

			reject(Error(`Non 200 code received at initial request (received ${statusCode})`))
			
			// Consume response to free memory
			res.resume()
			return

		}

		let html = ""
		res.on("data", chunk => html += chunk)
		res.on("end", () => {
			
			require("fs").writeFile("test.html", html, function () {})

			// Array of the videos inside the playlist
			const ytInitialData = collectData(html)

			//Something went wrong fetching the json and it has been handled
			if (!ytInitialData)
				return

			const title = ytInitialData
				.microformat
				.microformatDataRenderer
				.title

			const description = ytInitialData
			.microformat
			.microformatDataRenderer
			.description
			
			const thumbnails = {
				all: ytInitialData
					.microformat
					.microformatDataRenderer
					.thumbnail
					.thumbnails,
				best: util.bestThumbnail(
						ytInitialData
						.microformat
						.microformatDataRenderer
						.thumbnail
						.thumbnails
					)
			}

			let videos = util.formatVideoList(ytInitialData)
			
			const results = {
				id: ID,
				thumbnails,
				description,
				title,
				videos
			}

			loadMore(ytInitialData)

			function loadMore(ytData) {

				const continuation = ytData
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

				//console.log(continuation)
				if (!continuation) {
		
					resolve(results)
					return

				}
					

				const url = new URL("https://www.youtube.com")
				url.pathname = "/browse_ajax"
				url.searchParams.append("ctoken", continuation.nextContinuationData.continuation)
				url.searchParams.append("continuation", continuation.nextContinuationData.continuation)
				url.searchParams.append("itct", continuation.nextContinuationData.clickTrackingParams)

				//Get the next 100 videos and add them to the list
				https.get(url, res => {
					
					const { statusCode } = res
		
					if (statusCode != 200) {

						reject(Error(`Non 200 code received at fetchMore request (received ${statusCode})`))
						
						// Consume response to free memory
						res.resume()
						return

					}

					let html = ""
					res.on("data", chunk => html += chunk)
					res.on("end", () => {
						
						// Array of the videos inside the playlist
						const newInitialData = collectData(html)

						//Something went wrong fetching the json and it has been handled
						if (!newInitialData)
							return
						
						results.videos = results.videos.concat(util.formatVideoList(newInitialData))

						loadMore(newInitialData)

					
					})
				})

			}

		})
		
	})

	function collectData(html) {

		const beforeText = "window[\"ytInitialData\"] = "
	
		try {
			var ytInitialData = util.cutJson(beforeText, html)
		} catch(err) {
			reject(err)
			return null
		}
	
		if (!ytInitialData) {
			reject(Error("Unable to retrieve playlist data"))
			return
		}

		try {
			return JSON.parse(ytInitialData)
		} catch(err) {
			reject(Error("Unable to parse JSON (ytInitialData)"))
			return null
		}
	
	}

})

module.exports = getPlaylist
