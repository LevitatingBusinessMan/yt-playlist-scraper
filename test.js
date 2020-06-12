const playlists = require(".")
playlists("PLc1l1_YXYDH4BoWto9Mds2aaL_bn1lAG_")
.then(playlist => {
	console.log(playlist.videos.length)
})
.catch(console.error)