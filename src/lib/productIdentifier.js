/**
 * Product identifiers are normalized before any provider is queried.
 * The provider receives digits only; the UI retains the acquisition source.
 */

const SYMBOLOGIES = new Set(['upc_a', 'upc_e', 'ean_8', 'ean_13']);

function checksumValid(digits) {
  if (!/^\d+$/.test(digits) || digits.length < 2) return false;
  const body = digits.slice(0, -1);
  const check = Number(digits.at(-1));
  const sum = [...body].reduce((total, digit, index) => {
    const fromRight = body.length - index;
    return total + Number(digit) * (fromRight % 2 === 1 ? 3 : 1);
  }, 0);
  return (10 - (sum % 10)) % 10 === check;
}

function expandUpcE(digits) {
  if (!/^\d{8}$/.test(digits)) return null;
  const numberSystem = digits[0];
  const body = digits.slice(1, 7);
  const last = body[5];
  let manufacturer;
  let product;
  if (last <= '2') {
    manufacturer = `${body.slice(0, 2)}${last}0000`;
    product = body.slice(2, 5);
  } else if (last === '3') {
    manufacturer = `${body.slice(0, 3)}00000`;
    product = body.slice(3, 5);
  } else if (last === '4') {
    manufacturer = `${body.slice(0, 4)}00000`;
    product = body[4];
  } else {
    manufacturer = `${body.slice(0, 5)}0000`;
    product = `000${last}`;
  }
  const upcA = `${numberSystem}${manufacturer}${product}${digits[7]}`;
  return checksumValid(upcA) ? upcA : null;
}

function cleanRaw(raw) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const value = String(raw).trim().replace(/\s+/g, '');
  return /^\d+$/.test(value) ? value : null;
}

/**
 * @param {unknown} raw
 * @param {{source?: string, symbology?: string}} [options]
 */
export function normalizeProductIdentifier(raw, options = {}) {
  const source = options.source || 'unknown';
  const requested = options.symbology;
  if (requested && !SYMBOLOGIES.has(requested)) {
    return { valid: false, reason: 'unsupported_symbology', source };
  }
  const digits = cleanRaw(raw);
  if (!digits) return { valid: false, reason: 'digits_only_required', source };

  let symbology = requested;
  let canonical = digits;
  if (!symbology) {
    symbology =
      digits.length === 12
        ? 'upc_a'
        : digits.length === 13
          ? 'ean_13'
          : digits.length === 8
            ? 'ean_8'
            : null;
  }
  if (symbology === 'upc_e') canonical = expandUpcE(digits);
  if (!canonical) return { valid: false, reason: 'invalid_checksum', source, symbology };

  const expectedLength = symbology === 'upc_e' ? 8 : { upc_a: 12, ean_8: 8, ean_13: 13 }[symbology];
  if (
    !expectedLength ||
    digits.length !== expectedLength ||
    (symbology !== 'upc_e' && !checksumValid(digits))
  ) {
    return { valid: false, reason: 'invalid_checksum', source, symbology };
  }
  return {
    valid: true,
    raw: String(raw),
    digits,
    canonical,
    symbology,
    source,
    checksum_valid: true,
  };
}

export function productIdentifierError(reason) {
  return (
    {
      digits_only_required: 'Enter digits only, with spaces allowed between groups.',
      unsupported_symbology: 'This barcode format is not supported yet.',
      invalid_checksum: 'The barcode checksum is invalid. Check the digits and try again.',
    }[reason] || 'This product identifier is not valid.'
  );
}

export { checksumValid, expandUpcE };
