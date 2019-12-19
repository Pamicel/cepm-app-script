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

/**
 * Crée la liste sur laquelle sont choisit les complices
 * et les contraintes avant de créer les groupes
 */
function completerListePassagers () {
  const spreadsheet = SpreadsheetApp.openById('1XbtAZx6pQ_IDu2OrkJQvxRjR_3cAynLIgsuhQ1qDuOw');

  // import data from passengers sheet
  const passengersSheet = pa_getSheetById(spreadsheet, 442430394);
  const passengersData = passengersSheet.getDataRange().getValues();

  // import data from helloAsso sheet
  const helloAssoSheet = pa_getSheetById(spreadsheet, 0);
  const helloAssoData = helloAssoSheet.getDataRange().getValues();

  // import data from firm sheet
  const firmSheet = pa_getSheetById(spreadsheet, 233161391);
  const firmData = firmSheet.getDataRange().getValues();

  // import associative table
  const associativeSheet = pa_getSheetById(spreadsheet, 1319518012);
  const associativeTable = associativeSheet.getDataRange().getValues();
  const helloAssoToFirmVoyageFormat = associativeTable.reduce(function (acc, row) {
    acc[row[1]] = row[0];
    return acc;
  }, {});

  const HELLO_ASSO_COLUMNS = {
    LAST_NAME: 8,
    FIRST_NAME: 9,
    EMAIL: 12,
    VOYAGE: 3, // aka formule
  }

  const FIRM_COLUMNS = {
    LAST_NAME: 6,
    FIRST_NAME: 4,
    EMAIL: 2,
    VOYAGE: 3, // aka traversée
  }

  const PASSENGERS_COLUMNS = {
    VOYAGE: 1,
    FIRST_NAME: 2,
    LAST_NAME: 3,
    EMAIL: 4,
  }

  // Replace all voyages in helloAsso by what the assiciativeTable gives
  helloAssoData.forEach(function (row) {
    row[HELLO_ASSO_COLUMNS.VOYAGE] = helloAssoToFirmVoyageFormat[row[HELLO_ASSO_COLUMNS.VOYAGE]];
  });

  Logger.log(JSON.stringify(helloAssoData, null, 2));
  passengersSheet.getRange(1, 1).setValues(Logger.getLog());
}

function pa_dispatchGroups () {
  //

  // UTILS

  // Detecter les complices
  const isAccompliceOf = function (pass) {
    if (pass[accompliceIndices[EMERAUDE]] === 'Oui') {
      return EMERAUDE;
    }
    if (pass[accompliceIndices[BLEU]] === 'Oui') {
      return BLEU;
    }
    if (pass[accompliceIndices[ROSE]] === 'Oui') {
      return ROSE;
    }

    return (-1);
  };

  // Detecter les pet lovers (chiens et chats seulement)
  const isPetLover = function (pass) {
    return (
      pass[petIndex] === 'Oui' &&
      pass[petPrecisionIndex] &&
      (
        pass[petPrecisionIndex].indexOf('chien') !== -1 ||
        pass[petPrecisionIndex].indexOf('chat') !== -1
      )
    );
  };

  // Detecter les griefs
  const hasGrievance = function (pass) {
    return (pass[grievanceIndex] === 'Oui');
  };

  function groupIsFullFunction (groupSize) {
    function groupIsFull (group) {
      return (group.length === groupSize - (!group.hasAccomplice));
    }

    return groupIsFull;
  }

  // DATA HANDLING

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = pa_getSheetById(2071274177);
  const data = sourceSheet.getDataRange().getValues();

  const questions = [
    "Group",
    "AccompliceBleu",
    "AccompliceEmeraude",
    "AccompliceRose",
    //
    "Timestamp", // Important pour doubles
    "Username", // ID
    "Voyage", // Traversée (important)
    "LastName", // ID
    //
    "A", // Placeholder, do not remove
    //
    "FirstName", // ID
    //
    "B", // Placeholder, do not remove
    "C", // Placeholder, do not remove
    "D", // Placeholder, do not remove
    "E", // Placeholder, do not remove
    "F", // Placeholder, do not remove
    "G", // Placeholder, do not remove
    "H", // Placeholder, do not remove
    //
    "Pet", // Animal de compagnie
    "PetPrecision", // Parser pour 'chien'
    "Grievances", // Grief (important)
    //
    "I", // Placeholder, do not remove
    "J", // Placeholder, do not remove
    "K", // Placeholder, do not remove
    "L", // Placeholder, do not remove
    "M", // Placeholder, do not remove
    "N", // Placeholder, do not remove
    "O", // Placeholder, do not remove
    "P", // Placeholder, do not remove
    "Q", // Placeholder, do not remove
    "R", // Placeholder, do not remove
  ];
  const EMERAUDE = 0;
  const BLEU = 1;
  const ROSE = 2;

  // const groupIndex = questions.indexOf("Group");
  const accompliceIndices = [];
  accompliceIndices[EMERAUDE] = questions.indexOf("AccompliceEmeraude");
  accompliceIndices[BLEU] = questions.indexOf("AccompliceBleu");
  accompliceIndices[ROSE] = questions.indexOf("AccompliceRose");
  const timestampsIndex = questions.indexOf("Timestamp");
  const emailIndex = questions.indexOf("Username");
  const voyageIndex = questions.indexOf("Voyage");
  const petIndex = questions.indexOf("Pet");
  const petPrecisionIndex = questions.indexOf("PetPrecision");
  const grievanceIndex = questions.indexOf("Grievances");
  const fnIndex = questions.indexOf("FirstName");
  const lnIndex = questions.indexOf("LastName");

  // function transpose(a) {
  //   return Object.keys(a[0]).map(function (c) { return a.map(function (r) { return r[c]; }); });
  // }

  // Diviser par traversée

  const passengersByVoyage = divideByColumnVariations(data.slice(1), voyageIndex);
  const passIdentifier = createPassengerIdentifier(emailIndex, fnIndex, lnIndex);

  // Pour chaque traversée
  const voyages = Object.keys(passengersByVoyage);
  voyages.forEach(function (voyage) {
    // Supprimer les doubles adresses mail qui ont des noms très différents
      // (ne garder que celles avec le dernier timestamp)
    const passengersByIdentifier = rowByIdentifier(passengersByVoyage[voyage], passIdentifier);

    const passengersIdentifiers = Object.keys(passengersByIdentifier);
    const groupSize = Math.ceil(passengersIdentifiers.length / 3);

    // Create full group function
    const groupIsFull = groupIsFullFunction(groupSize);

    // Create groups
    const groups = passengersIdentifiers.reduce(function (groups, identifier) {
      const pass = passengersByIdentifier[identifier];

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
      } else if (!groupIsFull(groups[BLEU])) {
        // Tant que bleu n'est pas plein, mettre dans bleu
        groups[BLEU].passengers.push(pass);
      } else if (!groupIsFull(groups[ROSE])) {
        // Tant que rose n'est pas plein, mettre dans rose
        groups[ROSE].passengers.push(pass);
      } else {
        // Tant que emeraude n'est pas plein, mettre dans emeraude
        groups[EMERAUDE].passengers.push(pass);
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

    const height = groups[EMERAUDE].passengers.length;
    const width = groups[EMERAUDE].passengers[0].length;
    targetSheet.getRange(1, 1, height, width).setValues(groups[EMERAUDE].passengers);

    return;
  });
}