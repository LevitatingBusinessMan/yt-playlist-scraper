//Cuts JSON from page

function cutJson (startString, page) {

	if (page.indexOf(startString) < 0) {
		throw new Error("Unable to find starting string to cut from")
	}

	let startIndex = page.indexOf(startString) + startString.length
	const unCutJson = page.substring(startIndex).trim()

	let open, close;
	if (unCutJson[0] === '[') {
	  open = '[';
	  close = ']';
	} else if (unCutJson[0] === '{') {
	  open = '{';
	  close = '}';
	}
  
	if (!open) {
	  throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${unCutJson[0]}`);
	}
  
	// States if the loop is currently in a string
	let isString = false;
  
	// Current open brackets to be closed
	let counter = 0;
  
	let i;
	for (i = 0; i < unCutJson.length; i++) {
	  // Toggle the isString boolean when leaving/entering string
	  if (unCutJson[i] === '"' && unCutJson[i - 1] !== '\\') {
		isString = !isString;
		continue;
	  }
	  if (isString) continue;
  
	  if (unCutJson[i] === open) {
		counter++;
	  } else if (unCutJson[i] === close) {
		counter--;
	  }
  
	  // All brackets have been closed, thus end of JSON is reached
	  if (counter === 0) {
		// Return the cut JSON
		return unCutJson.substr(0, i + 1);
	  }
	}
  
	// We ran through the whole string and ended up with an unclosed bracket
	throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
  };

module.exports = cutJson
