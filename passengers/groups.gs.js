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
    FORCE_EMERAUDE: 8,
    FORCE_BLEU: 9,
    FORCE_ROSE: 10,
    FIRM_OK: 11,
    HAS_CAT_OR_DOG: 12,
    HAS_GRIEVANCES: 13,
  }

  // UTILS
  const accompliceIndices = [];
  accompliceIndices[EMERAUDE] = PASSENGERS_COLUMNS.ACCOMPLICE_EMERAUDE - 1;
  accompliceIndices[BLEU] = PASSENGERS_COLUMNS.ACCOMPLICE_BLEU - 1;
  accompliceIndices[ROSE] = PASSENGERS_COLUMNS.ACCOMPLICE_ROSE - 1;

  // Detecter les complices
  const isAccompliceOf = function (pass) {
    if (pass[accompliceIndices[EMERAUDE]]) {
      return EMERAUDE;
    }
    if (pass[accompliceIndices[BLEU]]) {
      return BLEU;
    }
    if (pass[accompliceIndices[ROSE]]) {
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
  const sourceSheet = pa_getSheetById(spreadsheet, 442430394);
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

    var tmp = true;
    // Create groups
    const groups = passengers.reduce(function (groups, pass) {
      const accompliceOf = isAccompliceOf(pass);

      // DEBUG
      if (tmp) {
        tmp = false;
        Logger.log(groups);
      }
      // Logger.log(isPetLover(pass));
      // Logger.log(hasGrievance(pass));
      // Logger.log(groupIsFull(BLEU));
      // Logger.log(groupIsFull(EMERAUDE));
      // Logger.log(groupIsFull(ROSE));
      // Logger.log("");
      // DEBUG

      if (accompliceOf !== -1) {
        // Si le passager est le complice d'un groupe en particulier, l'y mettre
        groups.hasAccomplice = true;
        groups[accompliceOf].passengers.push(pass);
        Logger.log('group ' + group + ' +1');
      } else if (!groupIsFull(groups[EMERAUDE]) && hasGrievance(pass)) {
        // Tant que emeraude n'est pas plein, et qu'il reste des griefs, les mettre dedans
        groups[EMERAUDE].passengers.push(pass);
        Logger.log('group EMERAUDE +1 | total ' + groups[EMERAUDE].passengers.length);
      } else if (!groupIsFull(groups[ROSE]) && isPetLover(pass)) {
        // Tant que rose n'est pas plein, et qu'il reste des pet lovers, les mettre dedans
        groups[ROSE].passengers.push(pass);
        Logger.log('group ROSE +1 | total ' + groups[ROSE].passengers.length);
      } else if (!groupIsFull(groups[BLEU])) {
        // Tant que bleu n'est pas plein, mettre dans bleu
        groups[BLEU].passengers.push(pass);
        Logger.log('group BLEU +1 | total ' + groups[BLEU].passengers.length);
      } else if (!groupIsFull(groups[ROSE])) {
        // Tant que rose n'est pas plein, mettre dans rose
        groups[ROSE].passengers.push(pass);
        Logger.log('group ROSE +1 | total ' + groups[ROSE].passengers.length);
      } else if (!groupIsFull(groups[EMERAUDE])) {
        // Tant que emeraude n'est pas plein, mettre dans emeraude
        groups[EMERAUDE].passengers.push(pass);
        Logger.log('group EMERAUDE +1 | total ' + groups[EMERAUDE].passengers.length);
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

    pa_getSheetById(spreadsheet, 1069358045).getRange(1, 1).setValue(Logger.getLog());


    const height = groups[EMERAUDE].passengers.length;
    const width = groups[EMERAUDE].passengers[0].length;

    const firstRow = [[
      'Traversée',
      'Prénom',
      'Nom',
      'Email',
      'Complice Emeraude',
      'Complice Bleu',
      'Complice Rose',
      'Force Emeraude',
      'Force Bleu',
      'Force Rose',
      'A rempli son FIRM',
      'A un chien ou un chat',
      'A des grief',
      'Date de création de la rangée',
    ]]
    targetSheet.getRange(1, 1, firstRow.length, firstRow[0].length).setValues(firstRow);
    targetSheet.getRange(2, 1, height, width).setValues(groups[EMERAUDE].passengers);

    return;
  });
}