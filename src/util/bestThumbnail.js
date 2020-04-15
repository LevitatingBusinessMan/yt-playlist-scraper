function bestThumbnail(thumbnails) {

	let best
	for (thumbnail of thumbnails) {

		if (!best)
		best = thumbnail
		else {
			//If this thumbnail has more pixels than bestThumbnail, update it
			if (best.height * best.width < thumbnail.height * thumbnail.width)
				best = thumbnail
		}
	
	}

	return best

}

module.exports = bestThumbnail
