function pa_dispatchGroups () {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const sourceSheet = pa_getSheetById(2071274177);

  // Logger.log(JSON.stringify(passengersByVoyage, null, 2));
  // targetSheet.getRange(1, 1).setValue(Logger.getLog());

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
    //
    "A", // Placeholder, do not remove
    "B", // Placeholder, do not remove
    "C", // Placeholder, do not remove
    "D", // Placeholder, do not remove
    "E", // Placeholder, do not remove
    "F", // Placeholder, do not remove
    "G", // Placeholder, do not remove
    "H", // Placeholder, do not remove
    "I", // Placeholder, do not remove
    "J", // Placeholder, do not remove
    //
    "Pet", // Animal de compagnie
    "PetPrecision", // Parser pour 'chien'
    "Grievances", // Grief (important)
    //
    "K", // Placeholder, do not remove
    "L", // Placeholder, do not remove
    "M", // Placeholder, do not remove
    "N", // Placeholder, do not remove
    "O", // Placeholder, do not remove
    "P", // Placeholder, do not remove
    "Q", // Placeholder, do not remove
    "R", // Placeholder, do not remove
    "S", // Placeholder, do not remove
    "T", // Placeholder, do not remove
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

  function transpose(a) {
    return Object.keys(a[0]).map(function (c) { return a.map(function (r) { return r[c]; }); });
  }

  // Diviser par traversée

  const passengersByVoyage = data.slice(1).reduce(function (acc, pass) {
    const voyageName = pass[voyageIndex];
    if (acc[voyageName]) {
      acc[voyageName].push(pass);
    } else {
      acc[voyageName] = [pass];
    }

    return (acc);
  }, {});

  // Pour chaque traversée
  const voyages = Object.keys(passengersByVoyage);
  voyages.forEach(function (voyage, INDEX) {
    // Supprimer les doubles adresses mail
      // (ne garder que celles avec le dernier timestamp)
    const passengersByEmail = passengersByVoyage[voyage].reduce(function (acc, pass) {
      const email = pass[emailIndex];
      const previousPass = acc[email];

      if (previousPass && (new Date(pass[timestampsIndex])).getTime() < (new Date(previousPass[timestampsIndex])).getTime()) {
        return (acc);
      }

      acc[email] = pass;
      return (acc);
    }, {});

    const passengersEmails = Object.keys(passengersByEmail);

    // Compute max group size
    const groupSize = Math.ceil(passengersEmails.length / 3);

    // Mettre les complices de côté
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

    // Mettre les Pet lovers (seulement "chien" et "chat") de côté
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

    // Mettre les griefs de côté
    const hasGrievance = function (pass) {
      return (pass[grievanceIndex] === 'Oui');
    };

    function groupIsFull (group) {
      return (group.length === groupSize - (!group.hasAccomplice));
    }

    const groups = passengersEmails.reduce(function (groups, email) {
      const pass = passengersByEmail[email];

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


    var targetSheet = spreadsheet.getSheetByName(voyage);
    if (targetSheet) {
      // Append the stuff
    } else {
      targetSheet = spreadsheet.insertSheet(voyage);
      // Append the stuff
    }

    // Logger.log(JSON.stringify(groups[EMERAUDE].passengers[0], null, 2));
    targetSheet.getRange(1, 1, groups[EMERAUDE].passengers.length, groups[EMERAUDE].passengers[0].length).setValues(groups[EMERAUDE].passengers);
    // targetSheet.getRange(1, 1).setValue(Logger.getLog());
    // Logger.clear();
    return;
  });
}