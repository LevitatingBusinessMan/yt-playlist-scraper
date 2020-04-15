String.prototype.between = function(before, after) {
	const startIndex = this.indexOf(before) + before.length
	const stopIndex = this.indexOf(after)

	if (startIndex < 0 || stopIndex < 0)
		return null

	return this.substring(startIndex, stopIndex)
}
