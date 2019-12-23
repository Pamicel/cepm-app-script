// Target and source sheets
function getDiagramSheet() {
  const spreadsheet = SpreadsheetApp.openById('1dHJb1geWyWj_zQgzAT9WeUIvf86MMeWcp69YYn3OvpA');
  return pa_getSheetById(spreadsheet, 1832439418);
}

function getVariationsSheet() {
  const spreadsheet = SpreadsheetApp.openById('1dHJb1geWyWj_zQgzAT9WeUIvf86MMeWcp69YYn3OvpA');
  return pa_getSheetById(spreadsheet, 1935916156);
}

function getInfoSheet() {
  const spreadsheet = SpreadsheetApp.openById('1dHJb1geWyWj_zQgzAT9WeUIvf86MMeWcp69YYn3OvpA');
  return pa_getSheetById(spreadsheet, 493082356);
}

//

/**
 * @param sheet {Sheet}
 * @param origin {array} [row {int}, col {int}]
 * @param allScenes {array} array of the columns to use in the info sheet
 */
function createDiagram(sheet, origin, allScenes, scenePrinter, paddings) {
  const activityPadding = paddings || [1, 0];
  var originCell = sheet.getRange(origin[0] + 1, origin[1] + 1); // +1 because absolute numbering of columns and rows start at 1 and not 0
  const activityWidth = scenePrinter.nColumns;
  const activityHeight = scenePrinter.nRows;

  const lenOfLargestRow = allScenes.reduce(function(acc, sc) { return sc.length > acc ? sc.length : acc }, 0);

  for (var i = 0; i < allScenes.length; i++) {
    var sceneRow = allScenes[i];
    var colsCenteringOffset = Math.round((lenOfLargestRow - sceneRow.length)  * activityWidth / 2);
    var row = origin[0] + activityHeight * i + activityPadding[0] * (i + 1);
    for (var sceneIndex = 0; sceneIndex < sceneRow.length; sceneIndex++) {
      var col = origin[1] + activityWidth * sceneIndex + activityPadding[1] * (sceneIndex + 1) + colsCenteringOffset;
      var infoCol = sceneRow[sceneIndex];
      scenePrinter.print([row, col], infoCol);
    }
  }
}

function createDiagramSheet() {
  // Activate the test sheet
  var sheet = getDiagramSheet();
  sheet.activate();
  // Reset the test sheet
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setFrozenColumns(0);
  sheet.setFrozenRows(0);

  // Todo include the following in a sheet and import it
  var allScenes = [
    [3, 4],
    [5],
    [6, 7, 8],
    [9, 10, 11],
    [12],
    [13, 14],
    [15, 16],
    [17],
    [18],
    [19],
  ];

  const fullScenePrinter = new FullScenePrinter(getInfoSheet(), getDiagramSheet());
  const activityPadding = [1, 0];
  createDiagram(sheet, [0, 0], allScenes, fullScenePrinter, activityPadding);
}

function createDiagramOnSheet(spreadsheet, sheetName, allScenes) {
  // Create the sheet for the voyage
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setFrozenColumns(0);
  sheet.setFrozenRows(0);

  sheet.getRange(1, 1, 1, 4)
    .clear()
    .merge()
    .setValue(sheetName)
    .setFontSize(24)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  const fullScenePrinter = new FullScenePrinter(getInfoSheet(), sheet);
  const activityPadding = [1, 0];
  createDiagram(sheet, [1, 0], allScenes, fullScenePrinter, activityPadding);
}

function createHostsDiagrams() {
  const spreadsheet = SpreadsheetApp.openById('1dHJb1geWyWj_zQgzAT9WeUIvf86MMeWcp69YYn3OvpA');

  const scenesSissi = [[3],[5],[6],[9],[12],[13],[15],[17],[18],[19]];
  createDiagramOnSheet(spreadsheet, 'Traversée Sissi', scenesSissi);

  const scenesJoris = [[3],[5],[6],[11],[12],[13],[15],[17],[18],[19]];
  createDiagramOnSheet(spreadsheet, 'Traversée Joris', scenesJoris);

  const scenesJules = [[3],[5],[7],[11],[12],[13],[16],[17],[18],[19]];
  createDiagramOnSheet(spreadsheet, 'Traversée Jules', scenesJules);

  const scenesMimouna = [[4],[5],[8],[10],[12],[14],[16],[17],[18],[19]];
  createDiagramOnSheet(spreadsheet, 'Traversée Mimouna', scenesMimouna);

  const scenesPat = [[3],[5],[8],[10],[12],[14],[16],[17],[18],[19]];
  createDiagramOnSheet(spreadsheet, 'Traversée Pat', scenesPat);

  const scenesFred = [[4],[5],[7],[9],[12],[13],[15],[17],[18],[19]];
  createDiagramOnSheet(spreadsheet, 'Traversée Fred', scenesFred);

  const scenesIris = [[3],[5],[14],[16],[17],[18],[19]];
  createDiagramOnSheet(spreadsheet, 'Traversée Iris', scenesIris);
}

function createGroupsDiagrams() {
  const spreadsheet = SpreadsheetApp.openById('1dHJb1geWyWj_zQgzAT9WeUIvf86MMeWcp69YYn3OvpA');

  var scenesBleu = [[3, 4],[5],[6],[9],[12],[13],[15],[17],[18],[19]];
  var scenesEmeraudeI = [[3, 4],[5],[8],[11],[12],[13],[15],[17],[18],[19]];
  var scenesEmeraudeII = [[3, 4],[5],[8],[11],[12],[14],[16],[17],[18],[19]];
  var scenesRose = [[3, 4],[5],[7],[10],[12],[14],[16],[17],[18],[19]];

  createDiagramOnSheet(spreadsheet, 'Traversée Bleue', scenesBleu);
  createDiagramOnSheet(spreadsheet, 'Traversée Émeraude I', scenesEmeraudeI);
  createDiagramOnSheet(spreadsheet, 'Traversée Émeraude II', scenesEmeraudeII);
  createDiagramOnSheet(spreadsheet, 'Traversée Rose', scenesRose);
}

function createVariationsSheet() {
  // Activate the test sheet
  var sheet = getVariationsSheet();
  sheet.activate();
  // Reset the test sheet
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setFrozenColumns(0);
  sheet.setFrozenRows(0);

  // Todo include the following in a sheet and import it
  var allScenes = [
    // [3, 4], slash the intro
    // [5], slash single scenes
    [6, 7, 8],
    [9, 10, 11],
    // [12],
    [13, 14],
    [15, 16],
    // [17],
    // [18],
    // [19],
  ];

  function transpose(a) {
    return Object.keys(a[0]).map(function (c) { return a.map(function (r) { return r[c]; }); });
  }

  const summaryPrinter = new SummaryScenePrinter(getInfoSheet(), getVariationsSheet());

  createDiagram(sheet, [1, 0], transpose(optionsFromSets(allScenes)), summaryPrinter, [0, 1]);
}