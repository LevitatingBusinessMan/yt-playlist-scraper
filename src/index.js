const https = require("https"),
	util = require("./util/index.js")


//TODO
// Maybe its a good idea to throw all of this in a try catch statement,
// this way everywere even in the utilities we can throw errors
// without having to deal with stopping the code and rejecting the promise

const getPlaylist = ID => new Promise((resolve, reject) => {
	
	if (!ID)
		reject(Error("No ID specified"))
	
	const cookies = []

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
			
			// Array of the videos inside the playlist
			const ytInitialData = collectData(html)

			if (!ytInitialData.microformat || !ytInitialData.microformat.microformatDataRenderer)
				return reject(Error("Unable to retrieve playlist data"))

			try {

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

					let continuations
					let clientVersion

					//Object is browse_ajax response
					if (ytData.length) {
						continuations = ytData[1]
							.response
							.continuationContents
							.playlistVideoListContinuation
							.continuations
						clientVersion = ytData[1]
							.response
							.responseContext
							.serviceTrackingParams
							.find(x => x.service == "CSI")
							.params
							.find(x => x.key == "cver")
							.value
					}

					//Object is ytInitialData
					else if (ytData.contents) {
						continuations = ytData
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
							.continuations
						clientVersion = ytData
							.responseContext
							.serviceTrackingParams
							.find(x => x.service == "CSI")
							.params
							.find(x => x.key == "cver")
							.value
					}
					
					else {
						return reject(Error("Can't recognize json data"))
					}

					//If the continuations is not present we have all videos
					if (!continuations) {
			
						resolve(results)
						return

					}

					const continuation = continuations[0]

					const url = new URL("https://www.youtube.com")
					url.pathname = "/browse_ajax"
					//url.searchParams.append("ctoken", continuation.nextContinuationData.continuation)
					url.searchParams.append("continuation", continuation.nextContinuationData.continuation)
					//url.searchParams.append("itct", continuation.nextContinuationData.clickTrackingParams)

					//Get the next 100 videos and add them to the list
					https.get(url,
						{
							//Only with these headers will we get a json response
							headers: {
								"x-youtube-client-name": "1",
								"x-youtube-client-version": clientVersion || "2.20200609.04.01"
							}
						} , res => {
						
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
							
							try {
								var json = JSON.parse(html)
							} catch (err) {
								return reject(Error("Unable to parse JSON (browse_ajax)"))
							}

							results.videos = results.videos.concat(util.formatVideoList(json))

							loadMore(json)
						
						})
					})

				}
			}
			catch (err) {
				reject(err)
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
