//function debugLog(that) {
//    Logger.log(that);
//    Logger.log(that.targetSheet);
//    pa_getSheetById(1832439418).activate().getRange(1, 1).setValue(Logger.getLog());
//}

function ScenePrinter (infoSheet, targetSheet, rangeRules, sceneDimensions) {
  if (sceneDimensions) {
    this.nColumns = sceneDimensions[1];
    this.nRows = sceneDimensions[0];
  }

  function linkFromInfoSheet (targetRow, targetCol, infoRow, infoCol) {
    var targetRange = this.targetSheet.getRange(targetRow, targetCol);
    targetRange.setValue("=" + "'" + this.infoSheet.getName() + "'!" + getInfoSheet().getRange(infoRow, infoCol).getA1Notation());
  }

  function formatCell (targetRow, targetCol, targetNumRow, targetNumCol, formatFunction) {
    const range = this.targetSheet.getRange(targetRow, targetCol, targetNumRow, targetNumCol);
    formatFunction(range);
  }

  function printScene (sceneOrigin, infoCol) {
    this.rangeFunctions.forEach(function (rangeFunction) {
      rangeFunction(sceneOrigin, infoCol);
    });
  }

  function createRangeFunction (rangeInfo) {
    return (function (sceneOrigin, infoCol) {
      const infoRow = rangeInfo.infoRow;
      const formatFunction = rangeInfo.formatFunction;
      const targetRow = sceneOrigin[0] + rangeInfo.targetOffset[0] + 1;
      const targetCol = sceneOrigin[1] + rangeInfo.targetOffset[1] + 1;
      const targetNumRow = rangeInfo.targetOffset[2] || 1;
      const targetNumCol = rangeInfo.targetOffset[3] || 1;

      this.formatCell(targetRow, targetCol, targetNumRow, targetNumCol, formatFunction);

      if (infoRow !== null) {
        this.linkFromInfoSheet(targetRow, targetCol, infoRow, infoCol);
      }
    }).bind(this);
  }

  this.infoSheet = infoSheet;
  this.targetSheet = targetSheet;
  /*
    rangeRules format:
    [
      { targetOffset: [row, col, nRows, nCols], infoRow, formatFunction },
      { targetOffset: [row, col, nRows, nCols], infoRow, formatFunction },
      { targetOffset: [row, col, nRows, nCols], infoRow, formatFunction },
      ...
    ]
  */
  this.linkFromInfoSheet = linkFromInfoSheet.bind(this);
  this.formatCell = formatCell.bind(this);
  this.print = printScene.bind(this);
  this.createRangeFunction = createRangeFunction.bind(this);

  this.rangeFunctions = rangeRules.map(this.createRangeFunction);
}

function FullScenePrinter (infoSheet, targetSheet) {
  /*
    |       | 0     | 1     | 2     | 3     |       |
    ------  ---------------------------------  ------
    |    0  |       | order |       |       |       |
    ------  ---------------------------------  ------
    |    1  | notes | hosts                 |       |
    ------  -       -------------------------  ------
    |    2  |       | place                 |       |
    ------  -       -------------------------  ------
    |    3  |       | activity      | nb    |       |
    ------  -       -               ---------  ------
    |    4  |       |               | gp1   |       |
    ------  -       -               ---------  ------
    |    5  |       |               | gp2   |       |
    ------  -       -               ---------  ------
    |    6  |       |               | gp3   |       |
    ------  ---------------------------------  ------
    |       |       |       |       |       |       |
  */

  const rangeRules = [
    // order
    {
      targetOffset: [0, 1],
      infoRow: 35,
      formatFunction: function (range) {
        range
          .clear()
          .setFontSize(9)
          .setFontFamily(null)
          .setFontColor("red");
      }
    },
    // notes
    {
      targetOffset: [1, 0, 6, 1],
      infoRow: 11,
      formatFunction: function (range) {
        range
          .clear()
          .setFontSize(9)
          .mergeVertically()
          .setFontStyle('italic')
          .setVerticalAlignment('middle')
          .setHorizontalAlignment('center')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      }
    },
    // hosts
    {
      targetOffset: [1, 1, 1, 3],
      infoRow: 36,
      formatFunction: function (range) {
        range
          .clear()
          .merge()
          .setFontSize(9)
          .setFontStyle('italic')
          .setHorizontalAlignment('left')
          .setVerticalAlignment('middle')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      }
    },
    // place
    {
      targetOffset: [2, 1, 1, 3],
      infoRow: 8,
      formatFunction: function (range) {
        range
          .clear()
          .merge()
          .setFontSize(9)
          .setHorizontalAlignment('left')
          .setVerticalAlignment('middle')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
          .setBackground('#efefef');
      }
    },
    // place
    {
      targetOffset: [3, 1, 4, 2],
      infoRow: 6,
      formatFunction: function (range) {
        range
          .clear()
          .merge()
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
          .setFontWeight('bold')
          .setBackground('#fff2cc');
      }
    },
    // group cells
    {
      targetOffset: [3, 3],
      infoRow: null, // Do not link info
      formatFunction: function (range) {
        var numberCell = range;
        var blueCell = numberCell.offset(1, 0);
        var magentaCell = numberCell.offset(2, 0);
        var emeraudeCell = numberCell.offset(3, 0);

        function formatGroupColorCell(cell, color) {
          var sheet = cell.getSheet();
          var conditionalFormatRules = sheet.getConditionalFormatRules();

          conditionalFormatRules.push(
            SpreadsheetApp.newConditionalFormatRule()
            .setRanges([cell])
            .whenTextEqualTo('x')
            .setBackground(color)
            .setFontColor(color)
            .build(),

            SpreadsheetApp.newConditionalFormatRule()
            .setRanges([cell])
            .whenCellNotEmpty()
            .setBold(true)
            .setBackground(color)
            .setFontColor('#FFFFFF')
            .build()
          );

          sheet.setConditionalFormatRules(conditionalFormatRules);
        };

        // Modify number cell
        numberCell
          .clear()
          .setFontSize(9)
          .setFontStyle('italic');
        // Color
        blueCell.clear();
        var blue = '#0000FF';
        formatGroupColorCell(blueCell, blue);
        // Color
        magentaCell.clear();
        var magenta = '#FF00FF';
        formatGroupColorCell(magentaCell, magenta);
        // Color
        emeraudeCell.clear();
        var emeraude = '#01d758';
        formatGroupColorCell(emeraudeCell, emeraude);
      }
    },
    {
      targetOffset: [1, 1, 6, 3],
      infoRow: null,
      formatFunction: function (range) {
        range.setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID);
      }
    }
  ];

  ScenePrinter.call(this, infoSheet, targetSheet, rangeRules, [7, 4]);
}

function SummaryScenePrinter (infoSheet, targetSheet) {
  /*
    |       | 0     | 1     |       |
    ------  -----------------  ------
    |    0  | hosts         |       |
    ------  -----------------  ------
    |    1  | place         |       |
    ------  -----------------  ------
    |    2  | activity      |       |
    ------  -----------------  ------
    |       |       |       |       |
  */

  const rangeRules = [
    // hosts
    {
      targetOffset: [0, 0, 1, 2],
      infoRow: 36,
      formatFunction: function (range) {
        range
          .clear()
          .merge()
          .setFontSize(9)
          .setFontStyle('italic')
          .setHorizontalAlignment('left')
          .setVerticalAlignment('middle')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      }
    },
    // place
    {
      targetOffset: [1, 0, 1, 2],
      infoRow: 8,
      formatFunction: function (range) {
        range
          .clear()
          .merge()
          .setFontSize(9)
          .setHorizontalAlignment('left')
          .setVerticalAlignment('middle')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
          .setBackground('#efefef');
      }
    },
    // place
    {
      targetOffset: [2, 0, 1, 2],
      infoRow: 6,
      formatFunction: function (range) {
        range
          .clear()
          .merge()
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
          .setFontWeight('bold')
          .setBackground('#fff2cc');
      }
    },
    // Border
    {
      targetOffset: [0, 0, 3, 2],
      infoRow: null,
      formatFunction: function (range) {
        range.setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID);
      }
    }
  ];

  ScenePrinter.call(this, infoSheet, targetSheet, rangeRules, [3, 2]);
}