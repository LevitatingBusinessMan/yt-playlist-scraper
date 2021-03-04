const https = require("https"),
	util = require("./util/index.js"),
	loadMore = require("./load_more.js");


const getPlaylist = ID => new Promise((resolve, reject) => {try{
	if (!ID)
		return reject(Error("No ID specified"))
	
	getHtml(ID).then((html) => {
		
		// Array of the videos inside the playlist
		const ytInitialData = collectData(html);

		//Something went wrong fetching the json and it has been handled
		if (!ytInitialData) return;

		if (!ytInitialData.microformat || !ytInitialData.microformat.microformatDataRenderer)
			return reject(Error("Unable to retrieve playlist data"))

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

		let {videos, continuation} = util.formatVideoList(ytInitialData)
		
		const results = {
			id: ID,
			thumbnails,
			description,
			title,
			videos
		}

		clientVersion = ytInitialData
			.responseContext
			.serviceTrackingParams
			.find(x => x.service == "CSI")
			.params
			.find(x => x.key == "cver")
			.value

		if (continuation) {
			loadMore(results, continuation, clientVersion).then(results => {
				resolve(results)
			}).catch(err => reject(err))
		} else {
			resolve(results)
		}

	}).catch(err => reject(err))
	} catch (err) {reject(err)}
})

function getHtml(ID) {

	const url = new URL("https://www.youtube.com")
	url.pathname = "/playlist"
	url.searchParams.append("list", ID)

	return new Promise(function(resolve, reject) {
		https.get(url,
			{
				// Without the deskopt user agent yt will not send its ytInitialData block of JSON
				headers: {
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36"
				}
			}, res => {
			
			const { statusCode } = res
			
			if (statusCode != 200) {
				return reject(Error(`Non 200 code received at initial request (received ${statusCode})`))
			}
	
			let html = ""
			res.on("data", chunk => html += chunk)
			res.on("end", () => {
				resolve(html)
			})
		})
	})
}

function collectData(html) {

	const beforeText = "var ytInitialData = "

	try {
		var ytInitialData = util.cutJson(beforeText, html)
	} catch(err) {
		reject(err)
		return
	}

	if (!ytInitialData) {
		reject(Error("Unable to retrieve playlist data"))
		return
	}

	try {
		return JSON.parse(ytInitialData)
	} catch(err) {
		reject(Error("Unable to parse JSON (ytInitialData)"))
		return
	}

}

module.exports = getPlaylist
