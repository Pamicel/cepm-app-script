function rowByIdentifier (data, rowIdentifier) {
  return data.reduce(function (acc, row) {
      const identifier = rowIdentifier(row);
      // Last in goes in
      acc[identifier] = row;
      return (acc);
    }, {});
}

function divideByColumnVariations (data, columnIndex) {
  return data.reduce(function (acc, row) {
    const variation = row[columnIndex];
    if (acc[variation]) {
      acc[variation].push(row);
    } else {
      acc[variation] = [row];
    }

    return (acc);
  }, {});
}

function createPassengerIdentifier (emailIndex, fnIndex, lnIndex) {
  function createPassengerIdentifier (pass) {
    return (pass[emailIndex].toLowerCase() + pass[lnIndex].toLowerCase() + pass[fnIndex].toLowerCase());
  }

  return createPassengerIdentifier;
}

function pa_dispatchGroups () {
  //
  const PASSENGERS_COLUMNS = {
    VOYAGE: 1,
    FIRST_NAME: 2,
    LAST_NAME: 3,
    EMAIL: 4,
    ACCOMPLICE_EMERAUDE: 5,
    ACCOMPLICE_BLEU: 6,
    ACCOMPLICE_ROSE: 7,
    FIRM_OK: 8,
    DOUBLE: 9,
    IS_PAYMENT_INFO: 10,
    HAS_CAT_OR_DOG: 11,
    HAS_GRIEVANCES: 12,
    VOYAGE_TYPE: 13,
  }

  // UTILS

  // Detecter les complices
  const isAccompliceOf = function (pass) {
    if (pass[PASSENGERS_COLUMNS.ACCOMPLICE_EMERAUDE - 1]) {
      return EMERAUDE;
    }
    if (pass[PASSENGERS_COLUMNS.ACCOMPLICE_BLEU - 1]) {
      return BLEU;
    }
    if (pass[PASSENGERS_COLUMNS.ACCOMPLICE_ROSE - 1]) {
      return ROSE;
    }

    return (-1);
  };

  // Detecter les pet lovers (chiens et chats seulement)
  const isPetLover = function (pass) {
    return (pass[petIndex]);
  };

  // Detecter les griefs
  const hasGrievance = function (pass) {
    return (pass[grievanceIndex]);
  };

  function groupIsFullFunction (groupSize) {
    function groupIsFull (group) {
      return (group.passengers.length >= (groupSize - (!group.hasAccomplice)));
    }

    return groupIsFull;
  }

  // DATA HANDLING

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = pa_getSheetById(spreadsheet, 1277416213);
  const data = sourceSheet.getDataRange().getValues();

  const BLEU = 0;
  const EMERAUDE = 1;
  const ROSE = 2;

  const voyageIndex = PASSENGERS_COLUMNS.VOYAGE - 1;
  const petIndex = PASSENGERS_COLUMNS.HAS_CAT_OR_DOG - 1;
  const grievanceIndex = PASSENGERS_COLUMNS.HAS_GRIEVANCES - 1;

  // function transpose(a) {
  //   return Object.keys(a[0]).map(function (c) { return a.map(function (r) { return r[c]; }); });
  // }

  // Diviser par traversée

  const passengersByVoyage = divideByColumnVariations(data.slice(1), voyageIndex);

  // Pour chaque traversée
  const voyages = Object.keys(passengersByVoyage).filter(function (val) { return val; });

  voyages.forEach(function (voyage) {
    const passengers = passengersByVoyage[voyage];
    const groupSize = Math.ceil(passengers.length / 3);

    // Create full group function
    const groupIsFull = groupIsFullFunction(groupSize);

    // Create groups
    const groups = passengers.reduce(function (groups, pass) {
      const accompliceOf = isAccompliceOf(pass);
      if (accompliceOf !== -1) {
        // Si le passager est le complice d'un groupe en particulier, l'y mettre
        groups.hasAccomplice = true;
        groups[accompliceOf].passengers.push(pass);
      } else if (!groupIsFull(groups[EMERAUDE]) && hasGrievance(pass)) {
        // Tant que emeraude n'est pas plein, et qu'il reste des griefs, les mettre dedans
        groups[EMERAUDE].passengers.push(pass);
      } else if (!groupIsFull(groups[ROSE]) && isPetLover(pass)) {
        // Tant que rose n'est pas plein, et qu'il reste des pet lovers, les mettre dedans
        groups[ROSE].passengers.push(pass);
      } else {
        const em = groups[EMERAUDE].passengers.length;
        const bl = groups[BLEU].passengers.length;
        const ro = groups[ROSE].passengers.length;
        const smallest = Math.min(em, bl, ro);

        switch (smallest) {
          case em:
            groups[EMERAUDE].passengers.push(pass);
            break;
          case bl:
            groups[BLEU].passengers.push(pass);
            break;
          case ro:
            groups[ROSE].passengers.push(pass);
            break;
        }
      }

      return groups;
    }, [
      {
        hasAccomplice: false,
        passengers: [],
      },
      {
        hasAccomplice: false,
        passengers: [],
      },
      {
        hasAccomplice: false,
        passengers: [],
      },
    ]);

    // Create the sheet for the voyage
    var targetSheet = spreadsheet.getSheetByName(voyage);
    if (!targetSheet) {
      targetSheet = spreadsheet.insertSheet(voyage);
    }

    const GROUPS_MEMBER_COLUMNS = [
      'COLOR',
      'NUMBER',
      'FIRST_NAME',
      'LAST_NAME',
      'FIRM_OK',
      'HAS_CAT_OR_DOG',
      'HAS_GRIEVANCES',
      'VOYAGE_TYPE',
      'ACCOMPLICE',
    ];
    const GROUP_MEMBER_INDICES = {
      COLOR:          GROUPS_MEMBER_COLUMNS.indexOf('COLOR'),
      NUMBER:          GROUPS_MEMBER_COLUMNS.indexOf('NUMBER'),
      FIRST_NAME:     GROUPS_MEMBER_COLUMNS.indexOf('FIRST_NAME'),
      LAST_NAME:      GROUPS_MEMBER_COLUMNS.indexOf('LAST_NAME'),
      FIRM_OK:        GROUPS_MEMBER_COLUMNS.indexOf('FIRM_OK'),
      HAS_CAT_OR_DOG: GROUPS_MEMBER_COLUMNS.indexOf('HAS_CAT_OR_DOG'),
      HAS_GRIEVANCES: GROUPS_MEMBER_COLUMNS.indexOf('HAS_GRIEVANCES'),
      VOYAGE_TYPE:    GROUPS_MEMBER_COLUMNS.indexOf('VOYAGE_TYPE'),
      ACCOMPLICE:     GROUPS_MEMBER_COLUMNS.indexOf('ACCOMPLICE'),
    }

    function passengerToGroupMember (color) {
      return function (passenger) {
        const member = [];

        member[GROUP_MEMBER_INDICES.COLOR] = color;
        member[GROUP_MEMBER_INDICES.NUMBER] = 0; // Placeholder for number in group
        member[GROUP_MEMBER_INDICES.FIRST_NAME] = passenger[PASSENGERS_COLUMNS.FIRST_NAME - 1];
        member[GROUP_MEMBER_INDICES.LAST_NAME] = passenger[PASSENGERS_COLUMNS.LAST_NAME - 1];
        member[GROUP_MEMBER_INDICES.FIRM_OK] = passenger[PASSENGERS_COLUMNS.FIRM_OK - 1];
        member[GROUP_MEMBER_INDICES.HAS_CAT_OR_DOG] = passenger[PASSENGERS_COLUMNS.HAS_CAT_OR_DOG - 1];
        member[GROUP_MEMBER_INDICES.HAS_GRIEVANCES] = passenger[PASSENGERS_COLUMNS.HAS_GRIEVANCES - 1];
        member[GROUP_MEMBER_INDICES.VOYAGE_TYPE] = passenger[PASSENGERS_COLUMNS.VOYAGE_TYPE - 1];
        member[GROUP_MEMBER_INDICES.ACCOMPLICE] = (
          passenger[PASSENGERS_COLUMNS.ACCOMPLICE_BLEU - 1] ||
          passenger[PASSENGERS_COLUMNS.ACCOMPLICE_EMERAUDE - 1] ||
          passenger[PASSENGERS_COLUMNS.ACCOMPLICE_ROSE - 1]
        );

        return member.map(function (val) { return val || ''; });
      };
    }

    const final = [];
    final[BLEU] = groups[BLEU].passengers.map(passengerToGroupMember('BLEU'));
    final[EMERAUDE] = groups[EMERAUDE].passengers.map(passengerToGroupMember('EMERAUDE'));
    final[ROSE] = groups[ROSE].passengers.map(passengerToGroupMember('ROSE'));

    // function isAccomplice (passenger) {
    //   return passenger[8];
    // }
    // const accompliceIndexBleu = final[BLEU].indexOf(final[BLEU].find(isAccomplice));
    // const accompliceBleu = final[BLEU].splice(accompliceIndexBleu, 1);
    // final[BLEU].splice(3, 0, accompliceBleu);

    var num = 1;
    for (var i = 0; i < final.length; i++) {
      for (var j = 0; j < final[i].length; j++) {
        final[i][j][1] = num;
        num++;
      }
    }

    const firstRow = [[
      'Groupe',
      'Numéro',
      'Prénom',
      'Nom',
      'A rempli son FIRM',
      'Parle de chien ou chat',
      'A des grief',
      'Type de traversée',
      'vip',
    ]]

    const padding = 0;
    const origin = [1, 1]; // In rows/columns numbering

    const firstRowRange = targetSheet.getRange(
      origin[0],
      origin[1],
      firstRow.length,
      firstRow[0].length
    );

    const bleuRange = targetSheet.getRange(
      origin[0] + firstRow.length + padding,
      origin[1],
      final[BLEU].length,
      final[BLEU][0].length
    );
    const emeraudeRange =  targetSheet.getRange(
      origin[0] + firstRow.length + padding + final[BLEU].length + padding,
      origin[1],
      final[EMERAUDE].length,
      final[EMERAUDE][0].length
    );
    const roseRange = targetSheet.getRange(
      origin[0] + firstRow.length + padding + final[BLEU].length + padding + final[EMERAUDE].length + padding,
      origin[1],
      final[ROSE].length,
      final[ROSE][0].length
    );

    // const allGroupsRange = targetSheet.getRange(
    //   origin[0] + firstRow.length + padding,
    //   origin[1],
    //   origin[0] + firstRow.length + padding + final[EMERAUDE].length + padding + final[BLEU].length + padding + final[ROSE].length,
    //   firstRow[0].length
    // );
    // var sheet = allGroupsRange.getSheet();
    // var conditionalFormatRules = sheet.getConditionalFormatRules();
    // const colEmeraude =
    // conditionalFormatRules.push(
    //   SpreadsheetApp.newConditionalFormatRule()
    //   .setRanges([cell])
    //   .whenTextEqualTo('EMERAUDE')
    //   .setBackground(color)
    //   .setFontColor(color)
    //   .build(),
    //   SpreadsheetApp.newConditionalFormatRule()
    //   .setRanges([cell])
    //   .whenCellNotEmpty()
    //   .setBold(true)
    //   .setBackground(color)
    //   .setFontColor('#FFFFFF')
    //   .build()
    // );
    // sheet.setConditionalFormatRules(conditionalFormatRules);

    targetSheet.getDataRange().clearContent();
    firstRowRange.setValues(firstRow);
    bleuRange.setValues(final[BLEU]);
    emeraudeRange.setValues(final[EMERAUDE]);
    roseRange.setValues(final[ROSE]);

    return;
  });
}