const bestThumbnail = require("./bestThumbnail")

function formatVideoList(ytData) {

	var rawVideoList

	//Object is browse_ajax response
	if (ytData.length) {
		rawVideoList = ytData[1]
			.response
			.continuationContents
			.playlistVideoListContinuation
			.contents
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
	for (video of rawVideoList) {
		video = video.playlistVideoRenderer

		// Video probably deleted
		if (!video.shortBylineText)
			continue

		const vidElement = {
			id: video.videoId,
			title: video.title.simpleText,
			thumbnails: {
				best: bestThumbnail(video.thumbnail.thumbnails),
				all: video.thumbnail.thumbnails
			},
			channel: {
				title: video.shortBylineText.runs[0].text,
				endpoint: video.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl,
				id: video.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId
			},
			duration: video.lengthSeconds
		}

		videos.push(vidElement)

	}
	return videos

}

module.exports = formatVideoList
