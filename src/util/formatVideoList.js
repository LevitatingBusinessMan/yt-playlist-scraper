const bestThumbnail = require("./bestThumbnail")

function formatVideoList(ytInitialData) {

	const rawVideoList = ytInitialData
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

	const videos = []
	for (video of rawVideoList) {
		video = video.playlistVideoRenderer

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
