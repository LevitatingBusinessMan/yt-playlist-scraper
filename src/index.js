const https = require("https"),
	util = require("./util/index.js"),
	loadMore = require("./load_more.js"),
	user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"

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

function redirect(prev) {
	cookie = prev.headers["set-cookie"][0].split(";")[0]
	loc = prev.headers.location;

	return new Promise((resolve, reject) => {
		https.get(loc, {
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
			"cookie": cookie
		}, res => {
			if (res.statusCode == 200 || res.statusCode == 303) {
				resolve(res)
			} else {
				reject(res)
			}
		})
	})
}

function getHtml(ID) {

	return new Promise(function(resolve, reject) {
	
		post_data = {
			gl:       "NL",
			m:        "false",
			pc:       "yt",
			continue: "https://www.youtube.com/playlist?list=" + ID,
			ca:       "r",
			x:        "6",
			v:        "cb.20210716-13-p1.nl+FX",
			t:        "ADw3F8irWyIQJoL4sjiOc4ECNbf6eWv5aQ:1626907256195",
			hl:       "nl",
			src:      "1",
			uxe:      "23983172"
		}
		
		let string_data = ""
		
		for (key in post_data) {
			string_data += `${encodeURI(key)}=${encodeURI(post_data[key])}&`
		}
		
		string_data = string_data.slice(0, -1);
		
		const options = {
			method: "POST",
			hostname: "consent.youtube.com",
			path: "/s",
			headers: {
				"User-Agent": user_agent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": string_data.length
			}
		}
		
		const req = https.request(options, (res) => {

			const { statusCode, statusMessage } = res

			if (statusCode != 303) {
				return reject(Error(`Non 303 code received at consent request (received ${statusCode} ${statusMessage})`))
			}

			redirect(res).then(res => {
				redirect(res).then(res => {
					const { statusCode, statusMessage } = res
			
					if (statusCode != 200) {
						return reject(Error(`Non 200 code received at initial request (received ${statusCode} ${statusMessage})`))
					}
			
					let html = ""
					res.on("data", chunk => html += chunk)
					res.on("end", () => {
						resolve(html)
					})
				}).catch(res => {
					return reject(Error(`Non 200 code received at second redirect (received ${res.statusCode} ${res.statusMessage})`))
				})
			}).catch(res => {
				return reject(Error(`Non 303 code received at first redirect (received ${res.statusCode} ${res.statusMessage})`))
			})
		});
		
		req.write(string_data);
		req.end();

	})


	const url = new URL("https://www.youtube.com")
	url.pathname = "/playlist"
	url.searchParams.append("list", ID)

	return new Promise(function(resolve, reject) {
		https.get(url,
			{
				// Without the deskopt user agent yt will not send its ytInitialData block of JSON
				headers: {
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36",
					"cookie": "CONSENT:YES+cb.20210716-13-p1.nl+FX;"
				}
			}, res => {
			
			const { statusCode, statusMessage } = res
			
			if (statusCode != 200) {
				console.log(res.headers)
				return reject(Error(`Non 200 code received at initial request (received ${statusCode} ${statusMessage})`))
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
