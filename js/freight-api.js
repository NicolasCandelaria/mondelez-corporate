/**
 * Mock freight quote API (PCNA-style postal-code freight).
 * Returns a Promise so the UI behaves like a real rate call.
 */
(function (global) {
  'use strict';

  function normalizePostal(raw) {
    return String(raw || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  function isValidPostal(code) {
    // US ZIP (5 or 9) or Canadian postal (A1A1A1)
    if (/^\d{5}(\d{4})?$/.test(code)) return true;
    if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(code)) return true;
    return false;
  }

  function zoneFromPostal(code) {
    if (/^[A-Z]/.test(code)) {
      // Canadian: first letter → rough zone
      var letter = code.charCodeAt(0) - 65;
      return 2 + (letter % 6);
    }
    var zip = parseInt(code.slice(0, 5), 10);
    if (zip < 20000) return 2;
    if (zip < 40000) return 3;
    if (zip < 60000) return 4;
    if (zip < 80000) return 5;
    return 6;
  }

  /**
   * @param {{ postalCode: string, qty: number, weightOz: number, productName?: string }} opts
   * @returns {Promise<{ ok: boolean, freight: number|null, currency: string, carrier: string, transitDays: number, message?: string }>}
   */
  function quoteFreight(opts) {
    var postal = normalizePostal(opts && opts.postalCode);
    var qty = Math.max(0, Number((opts && opts.qty) || 0));
    var weightOz = Math.max(1, Number((opts && opts.weightOz) || 8));

    return new Promise(function (resolve) {
      // Simulate network latency
      var delay = 280 + Math.floor(Math.random() * 220);
      setTimeout(function () {
        if (!postal) {
          resolve({
            ok: true,
            freight: null,
            currency: 'USD',
            carrier: '',
            transitDays: 0,
            message: 'Enter a postal code to include freight.'
          });
          return;
        }
        if (!isValidPostal(postal)) {
          resolve({
            ok: false,
            freight: null,
            currency: 'USD',
            carrier: '',
            transitDays: 0,
            message: 'Invalid postal / ZIP code.'
          });
          return;
        }
        if (qty < 1) {
          resolve({
            ok: false,
            freight: null,
            currency: 'USD',
            carrier: '',
            transitDays: 0,
            message: 'Quantity required for freight quote.'
          });
          return;
        }

        var zone = zoneFromPostal(postal);
        var totalLb = (qty * weightOz) / 16;
        var cartons = Math.max(1, Math.ceil(qty / 25));
        // Base + zone + weight + carton handling (coded / list-facing freight estimate)
        var freight =
          28 +
          zone * 12.5 +
          totalLb * 0.55 +
          cartons * 4.75;
        freight = Math.round(freight * 100) / 100;

        resolve({
          ok: true,
          freight: freight,
          currency: 'USD',
          carrier: zone <= 3 ? 'Ground LTL' : 'Express Ground',
          transitDays: 2 + zone,
          postalCode: postal,
          message: 'Freight estimate for single destination.'
        });
      }, delay);
    });
  }

  global.MdzFreight = {
    quote: quoteFreight,
    normalizePostal: normalizePostal,
    isValidPostal: isValidPostal
  };
})(typeof window !== 'undefined' ? window : globalThis);
