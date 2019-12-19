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
			acc.push.apply(acc, flat(depth, cur));
		} else {
			acc.push(cur);
		}

		return acc;
	}, []) : array.slice();
}

function getPassengerIndices () {
  const PASSENGER_COLUMNS = [
    'VOYAGE',
    'FIRST_NAME',
    'LAST_NAME',
    'EMAIL',
    'ACCOMPLICE_EMERAUDE',
    'ACCOMPLICE_BLEU',
    'ACCOMPLICE_ROSE',
    'FORCE_EMERAUDE',
    'FORCE_BLEU',
    'FORCE_ROSE',
    'FIRM_OK',
    'HAS_CAT_OR_DOG',
    'HAS_GRIEVANCES',
    'DOUBLE',
    'IS_PAYMENT_INFO',
  ];

  /**
    Passenger format:
    voyage | fn | ln | email | accompliceEmeraude | accompliceBleu | accompliceRose | forceEmeraude | forceBleu | forceRose | forceJauneDevanMarronDerriere | petLover | grief
   */
  const PASSENGER_FIELD_INDICES = {
    VOYAGE:               PASSENGER_COLUMNS.indexOf('VOYAGE'),
    FIRST_NAME:           PASSENGER_COLUMNS.indexOf('FIRST_NAME'),
    LAST_NAME:            PASSENGER_COLUMNS.indexOf('LAST_NAME'),
    EMAIL:                PASSENGER_COLUMNS.indexOf('EMAIL'),
    ACCOMPLICE_EMERAUDE:  PASSENGER_COLUMNS.indexOf('ACCOMPLICE_EMERAUDE'),
    ACCOMPLICE_BLEU:      PASSENGER_COLUMNS.indexOf('ACCOMPLICE_BLEU'),
    ACCOMPLICE_ROSE:      PASSENGER_COLUMNS.indexOf('ACCOMPLICE_ROSE'),
    FORCE_EMERAUDE:       PASSENGER_COLUMNS.indexOf('FORCE_EMERAUDE'),
    FORCE_BLEU:           PASSENGER_COLUMNS.indexOf('FORCE_BLEU'),
    FORCE_ROSE:           PASSENGER_COLUMNS.indexOf('FORCE_ROSE'),
    FIRM_OK:              PASSENGER_COLUMNS.indexOf('FIRM_OK'),
    HAS_CAT_OR_DOG:       PASSENGER_COLUMNS.indexOf('HAS_CAT_OR_DOG'),
    HAS_GRIEVANCES:       PASSENGER_COLUMNS.indexOf('HAS_GRIEVANCES'),
    DOUBLE:               PASSENGER_COLUMNS.indexOf('DOUBLE'),
    IS_PAYMENT_INFO:      PASSENGER_COLUMNS.indexOf('IS_PAYMENT_INFO'),
  }

  return PASSENGER_FIELD_INDICES;
}

function getHelloAssoIndices () {
  const HELLO_ASSO_FIELDS = {
    LAST_NAME: 8,
    FIRST_NAME: 7,
    EMAIL: 11,
    VOYAGE: 2, // aka formule
  }

  return HELLO_ASSO_FIELDS;
}
function getFirmIndices () {
  const FIRM_FIELDS = {
    LAST_NAME: 5,
    FIRST_NAME: 3,
    EMAIL: 1,
    VOYAGE: 2, // aka traversée
    HAS_PET: 13,
    WHICH_PET: 14,
    HAS_GRIEVANCES: 15,
  }

  return FIRM_FIELDS;
}

/**
 * Crée la liste sur laquelle sont choisit les complices
 * et les contraintes avant de créer les groupes
 */
function completerListePassagers () {
  const spreadsheet = SpreadsheetApp.openById('1XbtAZx6pQ_IDu2OrkJQvxRjR_3cAynLIgsuhQ1qDuOw');

  // get the target sheet
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

  const HELLO_ASSO_FIELDS = getHelloAssoIndices();

  const FIRM_FIELDS = getFirmIndices();

  // Replace all voyages in helloAsso by what the assiciativeTable gives
  helloAssoData.forEach(function (row) {
    row[HELLO_ASSO_FIELDS.VOYAGE] = helloAssoToFirmVoyageFormat[row[HELLO_ASSO_FIELDS.VOYAGE]];
  });

  // From FIRM and HelloAsso, format the data to the final passenger format

  const PASSENGER_FIELD_INDICES = getPassengerIndices();

  function createRowFormatter (voyageIndex, emailIndex, fnIndex, lnIndex, hasFilledFirm, isPetLover, hasGrief, isPayment) {
    function translateToPassengerRow (row) {
      function index(field) { return PASSENGER_FIELD_INDICES[field]; }

      const passenger = [];

      passenger[index('VOYAGE')] = row[voyageIndex]; // voyage
      passenger[index('FIRST_NAME')] = row[fnIndex]; // fn
      passenger[index('LAST_NAME')] = row[lnIndex]; // ln
      passenger[index('EMAIL')] = row[emailIndex]; // email
      passenger[index('ACCOMPLICE_EMERAUDE')] = ''; // accompliceEmeraude
      passenger[index('ACCOMPLICE_BLEU')] = ''; // accompliceBleu
      passenger[index('ACCOMPLICE_ROSE')] = ''; // accompliceRose
      passenger[index('FORCE_EMERAUDE')] = ''; // forceEmeraude
      passenger[index('FORCE_BLEU')] = ''; // forceBleu
      passenger[index('FORCE_ROSE')] = ''; // forceRose
      passenger[index('FIRM_OK')] = hasFilledFirm || ''; // firm ok
      passenger[index('HAS_CAT_OR_DOG')] = isPetLover(row); // petLover
      passenger[index('HAS_GRIEVANCES')] = hasGrief(row); // grief
      passenger[index('DOUBLE')] = ''; // has double
      passenger[index('IS_PAYMENT_INFO')] = isPayment || ''; // is payment

      return passenger;
    }

    return translateToPassengerRow
  }

  const formatHelloAssoRow = createRowFormatter(
    HELLO_ASSO_FIELDS.VOYAGE,
    HELLO_ASSO_FIELDS.EMAIL,
    HELLO_ASSO_FIELDS.FIRST_NAME,
    HELLO_ASSO_FIELDS.LAST_NAME,
    // Has filled firm ?
    false,
    function () { return false; },
    function () { return false; },
    true
  );
  var helloAssoPassengers = helloAssoData.map(formatHelloAssoRow);

  const formatFirm = createRowFormatter(
    FIRM_FIELDS.VOYAGE,
    FIRM_FIELDS.EMAIL,
    FIRM_FIELDS.FIRST_NAME,
    FIRM_FIELDS.LAST_NAME,
    // Has filled firm ?
    true,
    // Pet Lover ?
    function (pass) {
      if (
        pass[FIRM_FIELDS.HAS_PET] === 'Oui' &&
        pass[FIRM_FIELDS.WHICH_PET]
      ) {
        const dog = (pass[FIRM_FIELDS.WHICH_PET].toLowerCase().indexOf('chien') !== -1);
        const cat = (pass[FIRM_FIELDS.WHICH_PET].toLowerCase().indexOf('chat') !== -1);

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
      return (pass[FIRM_FIELDS.HAS_GRIEVANCES] === 'Oui');
    },
    false
  );

  var firmPassengers = firmData.map(formatFirm);

  // Now that everything has the correct format, merge all

  function createPassengerAdder (passengerIdentifier, options) {
    options = options || {};
    const overwritten = options.overwritten;
    const noNew = !!options.noNew;
    const isPayment = options.isPayment;

    function addPassenger (passengers, passenger) {
      passenger[PASSENGER_FIELD_INDICES.IS_PAYMENT_INFO] = isPayment || '';
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
            pass[PASSENGER_FIELD_INDICES.DOUBLE] = true;
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
    PASSENGER_FIELD_INDICES.VOYAGE,
    PASSENGER_FIELD_INDICES.FIRST_NAME,
    PASSENGER_FIELD_INDICES.LAST_NAME
  ]);

  const addPassenger = createPassengerAdder(passengerIdentifier, { isPayment: true });
  const firmAddPassenger = createPassengerAdder(
    passengerIdentifier,
    {
      overwritten: [
        PASSENGER_FIELD_INDICES.HAS_CAT_OR_DOG,
        PASSENGER_FIELD_INDICES.HAS_GRIEVANCES,
        PASSENGER_FIELD_INDICES.FIRM_OK,
      ],
    }
  );

  // Add all helloAsso passengers to a id -> passenger map
  var passengers = helloAssoPassengers.reduce(addPassenger, {});

  // // Overwrite with already existing passengers
  // passengers = passengersData.reduce(addPassenger, passengers);

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
    'Force Emeraude',
    'Force Bleu',
    'Force Rose',
    'A rempli son FIRM',
    'A un chien ou un chat',
    'A des grief',
    'Peut-etre doublon',
    'Infos de helloAsso',
  ]]
  passengersSheet.getRange(1, 1, firstRow.length, firstRow[0].length).setValues(firstRow);
  passengersSheet.getRange(2, 1, passengers.length, passengers[0].length).setValues(passengers);
}