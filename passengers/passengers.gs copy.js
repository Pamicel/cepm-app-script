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

function createPassengerIdentifier (indices) {
  function passengerIdentifier (pass) {
    return indices.reduce(
      function (identifier, i) {
        const value = pass[i];
        return (identifier + JSON.stringify(value).toLowerCase());
      }
    )
  }

  return passengerIdentifier;
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

/**
 * Crée la liste sur laquelle sont choisit les complices
 * et les contraintes avant de créer les groupes
 */
function completerListePassagers () {
  const spreadsheet = SpreadsheetApp.openById('1XbtAZx6pQ_IDu2OrkJQvxRjR_3cAynLIgsuhQ1qDuOw');

  // import data from passengers sheet
  const passengersSheet = pa_getSheetById(spreadsheet, 442430394);
  const passengersData = passengersSheet.getDataRange().getValues().slice(1);

  // import data from helloAsso sheet
  const helloAssoSheet = pa_getSheetById(spreadsheet, 0);
  var helloAssoData = helloAssoSheet.getDataRange().getValues().slice(1);

  // import data from firm sheet
  const firmSheet = pa_getSheetById(spreadsheet, 233161391);
  var firmData = firmSheet.getDataRange().getValues().slice(1);

  // import associative table
  const associativeSheet = pa_getSheetById(spreadsheet, 1319518012);
  const associativeTable = associativeSheet.getDataRange().getValues();
  const helloAssoToFirmVoyageFormat = associativeTable.reduce(function (acc, row) {
    acc[row[1]] = row[0];
    return acc;
  }, {});

  const HELLO_ASSO_COLUMNS = {
    LAST_NAME: 9,
    FIRST_NAME: 8,
    EMAIL: 12,
    VOYAGE: 3, // aka formule
  }

  const FIRM_COLUMNS = {
    LAST_NAME: 6,
    FIRST_NAME: 4,
    EMAIL: 2,
    VOYAGE: 3, // aka traversée
    HAS_PET: 14,
    WHICH_PET: 15,
    HAS_GRIEVANCES: 16,
  }

  // Replace all voyages in helloAsso by what the assiciativeTable gives
  helloAssoData.forEach(function (row) {
    row[HELLO_ASSO_COLUMNS.VOYAGE - 1] = helloAssoToFirmVoyageFormat[row[HELLO_ASSO_COLUMNS.VOYAGE - 1]];
  });

  // From FIRM and HelloAsso, format the data to the final passenger format

  /**
    Passenger format:
    voyage | fn | ln | email | accompliceEmeraude | accompliceBleu | accompliceRose | forceEmeraude | forceBleu | forceRose | forceJauneDevanMarronDerriere | petLover | grief
   */
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
    DOUBLE: 14,
  }

  function createRowFormatter (voyageIndex, emailIndex, fnIndex, lnIndex, hasFilledFirm, double, isPetLover, hasGrief) {
    function translateToPassengerRow (row) {
      return [
        row[voyageIndex], // voyage
        row[fnIndex], // fn
        row[lnIndex], // ln
        row[emailIndex], // email
        '', // accompliceEmeraude
        '', // accompliceBleu
        '', // accompliceRose
        '', // forceEmeraude
        '', // forceBleu
        '', // forceRose
        !!hasFilledFirm, // firm ok
        isPetLover(row), // petLover
        hasGrief(row), // grief
        new Date(), // Date de création de la rangée
        !!double,
      ]
    }

    return translateToPassengerRow
  }

  const formatHelloAssoRow = createRowFormatter(
    HELLO_ASSO_COLUMNS.VOYAGE - 1,
    HELLO_ASSO_COLUMNS.EMAIL - 1,
    HELLO_ASSO_COLUMNS.FIRST_NAME - 1,
    HELLO_ASSO_COLUMNS.LAST_NAME - 1,
    // Has filled firm ?
    false,
    // Is double
    false,
    function () { return false; },
    function () { return false; }
  );
  var helloAssoPassengers = helloAssoData.map(formatHelloAssoRow);

  const formatFirm = createRowFormatter(
    FIRM_COLUMNS.VOYAGE - 1,
    FIRM_COLUMNS.EMAIL - 1,
    FIRM_COLUMNS.FIRST_NAME - 1,
    FIRM_COLUMNS.LAST_NAME - 1,
    // Has filled firm ?
    true,
    // Is double
    false,
    // Pet Lover ?
    function (pass) {
      if (
        pass[FIRM_COLUMNS.HAS_PET - 1] === 'Oui' &&
        pass[FIRM_COLUMNS.WHICH_PET - 1]
      ) {
        const dog = (pass[FIRM_COLUMNS.WHICH_PET - 1].toLowerCase().indexOf('chien') !== -1);
        const cat = (pass[FIRM_COLUMNS.WHICH_PET - 1].toLowerCase().indexOf('chat') !== -1);

        if (dog && cat) {
          return ('BOTH');
        } else if (dog) {
          return ('DOG');
        } else if (cat) {
          return ('CAT')
        }
      }

      return (false);
    },
    // Has grievances ?
    function (pass) {
      return (pass[FIRM_COLUMNS.HAS_GRIEVANCES - 1] === 'Oui');
    }
  );

  var firmPassengers = firmData.map(formatFirm);

  pa_getSheetById(spreadsheet, 1069358045).getRange(1, 1).setValue('hello');


  // // Now that everything has the correct format, merge all

  // function createPassengerAdder (passengerIdentifier, overwritten, noNew) {
  //     function addPassenger (passengers, passenger) {
  //       const identifier = passengerIdentifier(passenger);
  //       Logger.log(identifier);
  //       // If the passenger already exists, only overwrite the selected columns
  //       if (passengers[identifier]) {
  //         Logger.log('exists');
  //         // If only certain columns are to be considered
  //         if (overwritten && overwritten.length) {
  //           Logger.log('is an overwrite');
  //           const newPassenger = passenger[identifier][0].slice(); // make copy of first passenger
  //           // Change said columns
  //           overwritten.forEach(function (index) {
  //             newPassenger[index] = passenger[index];
  //           });
  //           // Add to passengers
  //           passengers[identifier].push(newPassenger);
  //         } else {
  //           Logger.log('is simply pushed');
  //           // Otherwise simply add to passengers
  //           passengers[identifier].push(passenger);
  //         }
  //         // Tag this category as potential doubles
  //         passengers[identifier].forEach(function (pass) {
  //           Logger.log('update all to double');
  //           pass[PASSENGERS_COLUMNS.DOUBLE - 1] = true;
  //         });
  //       } else if (!noNew) {
  //         Logger.log('does not exist and is ignored');
  //         // Otherwise create the passenger category
  //         passengers[identifier] = [passenger];
  //       }
  //       Logger.log('');

  //       return (passengers);
  //     }

  //   return addPassenger;
  // }

  // const passengerIdentifier = createPassengerIdentifier([
  //   PASSENGERS_COLUMNS.VOYAGE - 1,
  //   PASSENGERS_COLUMNS.FIRST_NAME - 1,
  //   PASSENGERS_COLUMNS.LAST_NAME - 1
  // ]);

  // const addPassenger = createPassengerAdder(passengerIdentifier);
  // const firmAddPassenger = createPassengerAdder(
  //   passengerIdentifier,
  //   [
  //     PASSENGERS_COLUMNS.HAS_CAT_OR_DOG - 1,
  //     PASSENGERS_COLUMNS.HAS_GRIEVANCES - 1,
  //     PASSENGERS_COLUMNS.FIRM_OK - 1,
  //   ],
  //   true
  // );

  // // Add all helloAsso passengers to a id -> passenger map
  // var passengers = helloAssoPassengers.reduce(addPassenger, {});

  // // Overwrite with already existing passengers
  // passengers = passengersData.reduce(addPassenger, passengers);

  // // Overwrite again with firm-specific values
  // passengers = firmPassengers.reduce(firmAddPassenger, passengers);

  // var passengerIDs = Object.keys(passengers);
  // passengers = passengerIDs.map(function (id) {
  //   return flat(1, passengers[id]);
  // });

  // const firstRow = [[
  //   'Traversée',
  //   'Nom',
  //   'Prénom',
  //   'Email',
  //   'Complice Emeraude',
  //   'Complice Bleu',
  //   'Complice Rose',
  //   'Force Emeraude',
  //   'Force Bleu',
  //   'Force Rose',
  //   'A rempli son FIRM',
  //   'A un chien ou un chat',
  //   'A des grief',
  //   'Date de création de la rangée',
  //   'Peut-etre doublon'
  // ]]
  // passengersSheet.getRange(1, 1, firstRow.length, firstRow[0].length).setValues(firstRow);
  // passengersSheet.getRange(2, 1, passengers.length, passengers[0].length).setValues(passengers);
}