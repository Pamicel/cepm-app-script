function pa_getSheetById(id) {
  return SpreadsheetApp.getActive().getSheets().filter(function(s) {return s.getSheetId() === id;})[0];
}

function flat (depth, array) {
	depth = isNaN(depth) ? 1 : Number(depth);

	return depth ? array.reduce(function (acc, cur) {
		if (Array.isArray(cur)) {
			acc.push.apply(acc, flat(depth - 1, cur));
		} else {
			acc.push(cur);
		}

		return acc;
	}, []) : array.slice();
}