const bestThumbnail = require("./bestThumbnail")

function formatVideoList(ytData) {

	var rawVideoList

	//Object is browse response
	if (ytData.onResponseReceivedActions) {
		rawVideoList = ytData
			.onResponseReceivedActions[0]
			.appendContinuationItemsAction
			.continuationItems
	}

	//Object is ytInitialData
	else if (ytData.contents) {
		rawVideoList = ytData
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
			.contents
	}
	
	else {
		//return reject(Error("Can't recognize json data"))
	}

	const videos = []
	let continuation
	for (video of rawVideoList) {


		if (video.continuationItemRenderer) {
			continuation = video.continuationItemRenderer
			continue
		}

		video = video.playlistVideoRenderer

		// Video probably deleted
		if (!video || !video.shortBylineText)
			continue

		const vidElement = {
			id: video.videoId,
			title: video.title.simpleText || video.title.runs[0].text,
			thumbnails: {
				best: bestThumbnail(video.thumbnail.thumbnails),
				all: video.thumbnail.thumbnails
			},
			channel: {
				title: video.shortBylineText.runs[0].text,
				endpoint: video.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl,
				id: video.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId
			},
			index: parseInt(video.index.simpleText),
			duration: parseInt(video.lengthSeconds)
		}

		videos.push(vidElement)

	}
	return {
		videos,
		continuation
	}

}

module.exports = formatVideoList
