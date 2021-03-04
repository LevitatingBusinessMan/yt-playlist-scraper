const https = require("https")
const util = require("./util")

function loadMore(results, continuation, clientVersion) {
	return new Promise((resolve, reject) => {
		continuation = continuation.continuationEndpoint.continuationCommand.token

		const url = new URL("https://www.youtube.com")
		url.pathname = "/youtubei/v1/browse"
		url.searchParams.append("key", "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8")


		//Get the next 100 videos and add them to the list
		const request = https.request(url,
			{
				//Only with these headers will we get a json response
				headers: {
					"x-youtube-client-name": "1",
					"x-youtube-client-version": clientVersion || "2.20210302.07.01"
				},
				method: "POST"
			} , res => {
			
			const { statusCode } = res
	
			if (statusCode != 200) {

				console.log(res.statusMessage)
	
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
	
				let {continuation: new_continuation, videos: new_videos} = util.formatVideoList(json);
				results.videos = results.videos.concat(new_videos)
	
				if (new_continuation) {
					loadMore(results, new_continuation, clientVersion)
					.then(() => resolve(results))
					.catch(err => reject(err))
				} else {
					resolve(results)
				}
			})
		})
		//request.write(JSON.stringify({continuation}))
		request.write(JSON.stringify({
			"context":{
				"client":{
					"hl":"en-GB",
					"gl":"",
					"remoteHost":"",
					"deviceMake":"",
					"deviceModel":"",
					"visitorData":"",
					"userAgent":"",
					"clientName":"WEB",
					"clientVersion": clientVersion || "2.20210302.07.01",
					"osName":"",
					"osVersion":"",
					"originalUrl":"",
					"platform":"DESKTOP",
					"clientFormFactor":"UNKNOWN_FORM_FACTOR",
					"timeZone":"",
					"browserName":"",
					"browserVersion":"",
					"screenWidthPoints":927,
					"screenHeightPoints":902,
					"screenPixelDensity":1,
					"screenDensityFloat":1,
					"utcOffsetMinutes":60,
					"userInterfaceTheme":"USER_INTERFACE_THEME_LIGHT", // I sin
					"connectionType":"CONN_CELLULAR_4G",
					"mainAppWebInfo":{
						"graftUrl":"",
						"webDisplayMode":"WEB_DISPLAY_MODE_BROWSER"}
					},
					"user":{
						"lockedSafetyMode":false
					},
					"request":{
						"useSsl":true,
						"internalExperimentFlags":[]
						,"consistencyTokenJars":[]
					},"clickTracking":{
						"clickTrackingParams":""
					},"clientScreenNonce":"",
					"adSignalsInfo":{
						"params":[],
						"bid":""
					}},
					"continuation":continuation}))
		request.end()
	})
}

module.exports = loadMore;
