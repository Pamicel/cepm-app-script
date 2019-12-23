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
    VOYAGE_TYPE: 19,
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
    FIRM_OK: 8,
    DOUBLE: 9,
    IS_PAYMENT_INFO: 10,
    HAS_CAT_OR_DOG: 11,
    HAS_GRIEVANCES: 12,
    VOYAGE_TYPE: 13,
  }

  function createRowFormatter (voyageIndex, emailIndex, fnIndex, lnIndex, hasFilledFirm, isPetLover, hasGrief, isPayment, voyageType) {
    function translateToPassengerRow (row) {
      const passenger = [];

      passenger[PASSENGERS_COLUMNS.VOYAGE - 1] = row[voyageIndex]; // voyage
      passenger[PASSENGERS_COLUMNS.FIRST_NAME - 1] = row[fnIndex]; // fn
      passenger[PASSENGERS_COLUMNS.LAST_NAME - 1] = row[lnIndex]; // ln
      passenger[PASSENGERS_COLUMNS.EMAIL - 1] = row[emailIndex]; // email
      passenger[PASSENGERS_COLUMNS.ACCOMPLICE_EMERAUDE - 1] = ''; // accompliceEmeraude
      passenger[PASSENGERS_COLUMNS.ACCOMPLICE_BLEU - 1] = ''; // accompliceBleu
      passenger[PASSENGERS_COLUMNS.ACCOMPLICE_ROSE - 1] = ''; // accompliceRose
      passenger[PASSENGERS_COLUMNS.FIRM_OK - 1] = !!hasFilledFirm; // firm ok
      passenger[PASSENGERS_COLUMNS.VOYAGE_TYPE - 1] = voyageType(row);
      passenger[PASSENGERS_COLUMNS.HAS_CAT_OR_DOG - 1] = isPetLover(row); // petLover
      passenger[PASSENGERS_COLUMNS.HAS_GRIEVANCES - 1] = hasGrief(row); // grief
      passenger[PASSENGERS_COLUMNS.DOUBLE - 1] = false; // has double
      passenger[PASSENGERS_COLUMNS.IS_PAYMENT_INFO - 1] = !!isPayment; // is payment

      return passenger;
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
    function () { return false; },
    function () { return false; },
    true,
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
    // Pet Lover ?
    function (pass) {
      const whichPet = pass[FIRM_COLUMNS.WHICH_PET - 1];
      if (whichPet) {
        const dog = (whichPet.toLowerCase().indexOf('chien') !== -1);
        const cat = (whichPet.toLowerCase().indexOf('chat') !== -1);

        if (dog || cat) {
          return (whichPet);
        }
      }

      return (false);
    },
    // Has grievances ?
    function (pass) {
      return (pass[FIRM_COLUMNS.HAS_GRIEVANCES - 1] === 'Oui');
    },
    false,
    function (pass) {
      return (pass[FIRM_COLUMNS.VOYAGE_TYPE - 1]);
    }
  );

  var firmPassengers = firmData.map(formatFirm);

  // Now that everything has the correct format, merge all

  function createPassengerAdder (passengerIdentifier, options) {
    options = options || {};
    const overwritten = options.overwritten;
    const noNew = !!options.noNew;
    const isPayment = options.isPayment;

    function addPassenger (passengers, passenger) {
      passenger[PASSENGERS_COLUMNS.IS_PAYMENT_INFO - 1] = !!isPayment;
      const identifier = passengerIdentifier(passenger);
      // If the passenger already exists, only overwrite the selected columns
      if (passengers[identifier]) {
        // If only certain columns are to be considered
        if (overwritten && overwritten.length) {
          const newPassenger = passengers[identifier][0].slice(); // make copy of first passenger
          // Change said columns
          overwritten.forEach(function (index) {
            newPassenger[index] = passenger[index];
          });
          // Add to passengers
          passengers[identifier].push(newPassenger);
        } else {
          // Otherwise simply add to passengers
          passengers[identifier].push(passenger);
        }
        if (!isPayment) {
          // Tag this category as potential doubles
          passengers[identifier].forEach(function (pass) {
            pass[PASSENGERS_COLUMNS.DOUBLE - 1] = true;
          });
        }
      } else if (!noNew) {
        // Otherwise create the passenger category
        passengers[identifier] = [passenger];
      }

      return (passengers);
    }

    return addPassenger;
  }

  const passengerIdentifier = createPassengerIdentifier([
    PASSENGERS_COLUMNS.VOYAGE - 1,
    PASSENGERS_COLUMNS.FIRST_NAME - 1,
    PASSENGERS_COLUMNS.LAST_NAME - 1
  ]);

  const addPassenger = createPassengerAdder(passengerIdentifier, { isPayment: true });
  const firmAddPassenger = createPassengerAdder(
    passengerIdentifier,
    {
      overwritten: [
        PASSENGERS_COLUMNS.HAS_CAT_OR_DOG - 1,
        PASSENGERS_COLUMNS.HAS_GRIEVANCES - 1,
        PASSENGERS_COLUMNS.FIRM_OK - 1,
        PASSENGERS_COLUMNS.VOYAGE_TYPE - 1,
      ],
    }
  );

  // Add all helloAsso passengers to a id -> passenger map
  var passengers = helloAssoPassengers.reduce(addPassenger, {});

  // Overwrite again with firm-specific values
  passengers = firmPassengers.reduce(firmAddPassenger, passengers);

  var passengerIDs = Object.keys(passengers);
  passengers = passengerIDs.map(function (id) {
    return passengers[id];
  });
  passengers = flat(1, passengers);

  const firstRow = [[
    'Traversée',
    'Nom',
    'Prénom',
    'Email',
    'Complice Emeraude',
    'Complice Bleu',
    'Complice Rose',
    'A rempli son FIRM',
    'Peut-etre doublon',
    'Infos de helloAsso',
    'Parle de chien ou chat',
    'A des grief',
    'Type de traversée',
  ]]

  passengersSheet.getRange(1, 1, firstRow.length, firstRow[0].length).setValues(firstRow);
  passengersSheet.getRange(2, 1, passengers.length, passengers[0].length).setValues(passengers);
}