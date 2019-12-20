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

  const EMERAUDE = 0;
  const BLEU = 1;
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

    function passengerToGroupMember (color) {
      return function (passenger) {
        return [
          color,
          passenger[PASSENGERS_COLUMNS.FIRST_NAME - 1],
          passenger[PASSENGERS_COLUMNS.LAST_NAME - 1],
          passenger[PASSENGERS_COLUMNS.FIRM_OK - 1],
          passenger[PASSENGERS_COLUMNS.HAS_CAT_OR_DOG - 1],
          passenger[PASSENGERS_COLUMNS.HAS_GRIEVANCES - 1],
          (
            passenger[PASSENGERS_COLUMNS.ACCOMPLICE_BLEU - 1] ||
            passenger[PASSENGERS_COLUMNS.ACCOMPLICE_EMERAUDE - 1] ||
            passenger[PASSENGERS_COLUMNS.ACCOMPLICE_ROSE - 1]
          ),
        ]
      };
    }

    const final = [];
    final[EMERAUDE] = groups[EMERAUDE].passengers.map(passengerToGroupMember('EMERAUDE'));
    final[BLEU] = groups[BLEU].passengers.map(passengerToGroupMember('BLEU'));
    final[ROSE] = groups[ROSE].passengers.map(passengerToGroupMember('ROSE'));

    const firstRow = [[
      'Groupe',
      'Prénom',
      'Nom',
      'A rempli son FIRM',
      'Parle de chien ou chat',
      'A des grief',
      'vip',
    ]]

    const firstRowRange = targetSheet.getRange(1, 1, firstRow.length, firstRow[0].length);

    const emeraudeRange = targetSheet.getRange(3, 1, final[EMERAUDE].length, final[EMERAUDE][0].length)
    const bleuRange =  targetSheet.getRange(3 + final[EMERAUDE].length + 1, 1, final[BLEU].length, final[BLEU][0].length);
    const roseRange = targetSheet.getRange(3 + final[EMERAUDE].length + 1 + final[BLEU].length + 1, 1, final[ROSE].length, final[ROSE][0].length);

    targetSheet.getDataRange().clearContent();
    firstRowRange.setValues(firstRow);
    emeraudeRange.setValues(final[EMERAUDE]);
    bleuRange.setValues(final[BLEU]);
    roseRange.setValues(final[ROSE]);

    return;
  });
}