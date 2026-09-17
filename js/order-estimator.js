/**
 * PCNA-style Order Estimator — coded pricing only (no Net).
 * Dec variants: embroidery stitch bands, heat transfer, silk screen, blank.
 */
(function (global) {
  'use strict';

  var DETAIL_TO_PRODUCT = {
    'detail-wave-tee': 'wave-tee',
    'detail-beanie': 'beanie',
    'detail-dress-shirt': 'dress-shirt',
    'detail-satin-blouse': 'satin-blouse',
    'detail-track-jacket': 'track-jacket',
    'detail-puffer-jacket': 'puffer-jacket'
  };

  /** Industry-style coded deco methods (list / 5C product + G setup & run). */
  var DECO_METHODS = [
    {
      id: 'emb-std',
      name: 'Embroidery for 1–10,001 Stitches',
      setup: 62.5, // G
      run: 2.85, // G per unit (base 1 colour)
      runPerExtraColor: 0.55,
      maxColors: 12,
      notes: 'Maximum thread color count is 12. First location only.',
      leadDays: 12,
      tags: ['embroidery']
    },
    {
      id: 'emb-heavy',
      name: 'Embroidery for >10,001 Stitches',
      setup: 80.0,
      run: 4.2,
      runPerExtraColor: 0.65,
      maxColors: 12,
      notes: 'Heavy stitch count. Maximum thread color count is 12.',
      leadDays: 14,
      tags: ['embroidery']
    },
    {
      id: 'heat-transfer',
      name: 'Heat Transfer — Digital Print',
      setup: 45.0,
      run: 1.95,
      runPerExtraColor: 0, // full-color process
      maxColors: 4,
      notes: 'Full-color heat transfer. First location only. Max imprint 5" × 5".',
      leadDays: 8,
      tags: ['heat-transfer', 'screen-print']
    },
    {
      id: 'heat-premium',
      name: 'Heat Transfer — PhotoGrafixx',
      setup: 55.0,
      run: 2.65,
      runPerExtraColor: 0,
      maxColors: 4,
      notes: 'Photo-quality transfer. First location only.',
      leadDays: 10,
      tags: ['heat-transfer']
    },
    {
      id: 'silk',
      name: 'Color Print SilkScreen',
      setup: 50.0,
      run: 0.85,
      runPerExtraColor: 0.35,
      maxColors: 6,
      notes: 'Additional ink colors billed as run charge. First location only.',
      leadDays: 10,
      tags: ['screen-print']
    },
    {
      id: 'blank',
      name: 'Blank',
      setup: 0,
      run: 0,
      runPerExtraColor: 0,
      maxColors: 0,
      notes: 'Undecorated goods. No setup or run charge.',
      leadDays: 5,
      tags: ['blank']
    }
  ];

  var state = {
    detailId: null,
    product: null,
    qty: 250,
    decoColors: 1,
    postal: '',
    freight: null,
    freightMsg: '',
    freightLoading: false,
    calculated: false
  };

  function money(n) {
    if (n == null || isNaN(n)) return 'N/A';
    return (
      '$' +
      Number(n).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function unitPrice(product, qty) {
    if (global.priceForQty) return global.priceForQty(product, qty);
    var breaks = (product.priceBreaks || []).slice().sort(function (a, b) {
      return a.minQty - b.minQty;
    });
    var price = breaks.length ? breaks[0].price : 0;
    for (var i = 0; i < breaks.length; i++) {
      if (qty >= breaks[i].minQty) price = breaks[i].price;
    }
    return price;
  }

  function methodsForProduct(product) {
    var tags = (product.decoration || []).slice();
    // Always offer blank + at least embroidery + heat for apparel programs
    var allow = { blank: true, embroidery: true, 'heat-transfer': true, 'screen-print': true };
    tags.forEach(function (t) {
      allow[t] = true;
    });
    return DECO_METHODS.filter(function (m) {
      return m.tags.some(function (t) {
        return allow[t];
      });
    });
  }

  function runCharge(method, decoColors) {
    if (method.id === 'blank') return 0;
    var colors = Math.max(1, Math.min(decoColors, method.maxColors || decoColors));
    if (method.runPerExtraColor === 0) return method.run; // process / full color
    return method.run + Math.max(0, colors - 1) * method.runPerExtraColor;
  }

  function ensureEstimator(detailEl) {
    // Prefer the mount inside the PDP order panel (replaces Order Quantities)
    var mount = detailEl.querySelector('#oe-mount');
    if (mount) {
      var existing = mount.querySelector('.order-estimator');
      if (existing) return existing;
      var wrap = document.createElement('section');
      wrap.className = 'order-estimator';
      wrap.setAttribute('aria-label', 'Order Estimator');
      mount.appendChild(wrap);
      return wrap;
    }

    var existingOuter = detailEl.querySelector('.order-estimator');
    if (existingOuter) return existingOuter;

    var wrapOuter = document.createElement('section');
    wrapOuter.className = 'order-estimator';
    wrapOuter.setAttribute('aria-label', 'Order Estimator');
    var infoBlock = detailEl.querySelector('.info-block');
    if (infoBlock) {
      infoBlock.parentNode.insertBefore(wrapOuter, infoBlock);
    } else {
      (detailEl.querySelector('main') || detailEl).appendChild(wrapOuter);
    }
    return wrapOuter;
  }

  function renderShell(product) {
    var colorOptions = '';
    for (var i = 1; i <= 12; i++) {
      colorOptions +=
        '<option value="' +
        i +
        '"' +
        (i === state.decoColors ? ' selected' : '') +
        '>' +
        i +
        '</option>';
    }

    return (
      '<div class="oe-card">' +
      '<header class="oe-header">' +
      '<div>' +
      '<h3 class="oe-title">Order Estimator</h3>' +
      '<p class="oe-sub">Fill out for a quick cost breakdown for each available deco method. These charges are for first location only; additional locations incur additional run charges.</p>' +
      '</div>' +
      '<span class="oe-coded-badge" title="Industry coded / list pricing">Coded pricing</span>' +
      '</header>' +
      '<div class="oe-controls">' +
      '<label class="oe-field"><span>Quantity</span>' +
      '<input type="number" id="oe-qty" min="1" step="1" value="' +
      state.qty +
      '"></label>' +
      '<label class="oe-field"><span>Deco Colors</span>' +
      '<select id="oe-colors">' +
      colorOptions +
      '</select></label>' +
      '<button type="button" class="btn btn-primary oe-calc" id="oe-calculate">Calculate</button>' +
      '<label class="oe-field oe-postal"><span>Postal Code <em>Optional</em></span>' +
      '<input type="text" id="oe-postal" maxlength="10" placeholder="e.g. 44147 or V3S1Z3" value="' +
      escapeHtml(state.postal) +
      '">' +
      '<small>Includes freight in the quote when provided.</small></label>' +
      '</div>' +
      '<p class="oe-product-name">' +
      escapeHtml(product.sku) +
      ' ' +
      escapeHtml(product.name) +
      '</p>' +
      '<div class="oe-table-wrap" id="oe-results">' +
      '<p class="oe-placeholder">Enter quantity and click <strong>Calculate</strong> to see coded estimates by deco method.</p>' +
      '</div>' +
      '<p class="oe-disclaimer"><a href="#terms" onclick="showPage(\'terms\')">View Shipping Cost Disclaimer</a></p>' +
      '</div>'
    );
  }

  function buildRows(product, freight) {
    var qty = state.qty;
    var decoColors = state.decoColors;
    var unit = unitPrice(product, qty);
    var productCost = unit * qty;
    var methods = methodsForProduct(product);

    var rows = methods
      .map(function (m) {
        var run = runCharge(m, decoColors);
        var setup = m.setup;
        var runTotal = run * qty;
        var freightVal = freight != null ? freight : null;
        var sub =
          productCost +
          setup +
          runTotal +
          (freightVal != null ? freightVal : 0);

        return (
          '<tr data-deco="' +
          m.id +
          '">' +
          '<td class="oe-deco-name">' +
          escapeHtml(m.name) +
          '</td>' +
          '<td>' +
          money(productCost) +
          '<div class="oe-cell-note">@ ' +
          money(unit) +
          ' (5C)</div></td>' +
          '<td>' +
          (setup > 0 ? money(setup) : '—') +
          '</td>' +
          '<td>' +
          (run > 0 ? money(runTotal) + '<div class="oe-cell-note">@ ' + money(run) + '/pc</div>' : '—') +
          '</td>' +
          '<td>' +
          (freightVal != null ? money(freightVal) : 'N/A') +
          '</td>' +
          '<td class="oe-subtotal">' +
          money(sub) +
          '</td>' +
          '<td class="oe-notes">' +
          escapeHtml(m.notes) +
          '</td>' +
          '<td>' +
          m.leadDays +
          ' Days</td>' +
          '</tr>'
        );
      })
      .join('');

    var postalLabel = state.postal
      ? global.MdzFreight
        ? global.MdzFreight.normalizePostal(state.postal)
        : state.postal
      : '—';

    return (
      '<div class="oe-scroll">' +
      '<table class="oe-table">' +
      '<thead><tr>' +
      '<th>Deco Methods Available</th>' +
      '<th>Product Cost <span class="oe-code">(5C)</span></th>' +
      '<th>Set Up <span class="oe-code">(G)</span></th>' +
      '<th>Run Charge <span class="oe-code">(G)</span></th>' +
      '<th>Freight</th>' +
      '<th>Subtotal</th>' +
      '<th>Notes</th>' +
      '<th>Lead Time</th>' +
      '</tr></thead>' +
      '<tbody>' +
      rows +
      '</tbody></table></div>' +
      '<div class="oe-summary">' +
      '<strong>Qty:</strong> ' +
      qty.toLocaleString('en-US') +
      ' &nbsp;|&nbsp; <strong>Deco Colors:</strong> ' +
      decoColors +
      ' &nbsp;|&nbsp; <strong>Postal Code:</strong> ' +
      escapeHtml(postalLabel) +
      (state.freightMsg
        ? ' &nbsp;|&nbsp; <span class="oe-freight-msg">' + escapeHtml(state.freightMsg) + '</span>'
        : '') +
      '</div>' +
      '<div class="oe-actions">' +
      '<button type="button" class="btn btn-secondary" id="oe-download" onclick="alert(\'Quote sheet download is a prototype action.\')">Download Quote Sheet</button>' +
      '<span class="oe-pricing-note">Showing <strong>Coded</strong> pricing only (5C / G). Net pricing is not available on this portal.</span>' +
      '</div>'
    );
  }

  function showLoading(el) {
    el.innerHTML =
      '<p class="oe-placeholder oe-loading">Calculating coded estimates' +
      (state.postal ? ' and freight rates' : '') +
      '…</p>';
  }

  function calculate() {
    var product = state.product;
    if (!product) return;
    var wrap = document.querySelector(
      '#' + state.detailId + ' .order-estimator #oe-results'
    );
    if (!wrap) wrap = document.querySelector('.order-estimator #oe-results');
    if (!wrap) return;

    var qtyInput = document.getElementById('oe-qty');
    var colorsInput = document.getElementById('oe-colors');
    var postalInput = document.getElementById('oe-postal');

    state.qty = Math.max(1, parseInt(qtyInput && qtyInput.value, 10) || 1);
    state.decoColors = Math.max(1, parseInt(colorsInput && colorsInput.value, 10) || 1);
    state.postal = (postalInput && postalInput.value) || '';
    state.freightLoading = true;
    state.calculated = true;
    showLoading(wrap);

    var freightPromise =
      global.MdzFreight && state.postal.trim()
        ? global.MdzFreight.quote({
            postalCode: state.postal,
            qty: state.qty,
            weightOz: product.weightOz || 8,
            productName: product.name
          })
        : Promise.resolve({
            ok: true,
            freight: null,
            message: state.postal.trim()
              ? ''
              : 'Freight omitted — add a postal code to include.'
          });

    freightPromise.then(function (result) {
      state.freightLoading = false;
      if (!result.ok) {
        state.freight = null;
        state.freightMsg = result.message || 'Freight unavailable';
      } else {
        state.freight = result.freight;
        state.freightMsg = result.freight != null
          ? (result.carrier || 'Freight') +
            ' · ~' +
            result.transitDays +
            ' day transit'
          : result.message || '';
      }
      wrap.innerHTML = buildRows(product, state.freight);
    });
  }

  function bindControls(root) {
    var btn = root.querySelector('#oe-calculate');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        calculate();
      });
    }
    var postal = root.querySelector('#oe-postal');
    if (postal) {
      postal.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          calculate();
        }
      });
    }
  }

  function bind(detailId) {
    var productId = DETAIL_TO_PRODUCT[detailId];
    var product = productId && global.getProductById
      ? global.getProductById(productId)
      : null;
    if (!product) return;

    var detailEl = document.getElementById(detailId);
    if (!detailEl) return;

    state.detailId = detailId;
    state.product = product;
    // Sensible default qty = first price break
    if (product.priceBreaks && product.priceBreaks[0]) {
      state.qty = product.priceBreaks[0].minQty >= 100 ? 250 : product.priceBreaks[0].minQty;
    }

    var el = ensureEstimator(detailEl);
    el.innerHTML = renderShell(product);
    bindControls(el);
  }

  function wrapShowDetail() {
    if (typeof global.showDetail !== 'function') return;
    if (global.showDetail.__mdzEstimatorWrapped) return;
    var original = global.showDetail;
    function wrapped(id) {
      original(id);
      bind(id);
    }
    wrapped.__mdzEstimatorWrapped = true;
    global.showDetail = wrapped;
  }

  function init() {
    wrapShowDetail();
    var active = document.querySelector('.detail-wrap.active');
    if (active && active.id) bind(active.id);
    global.addEventListener('hashchange', function () {
      wrapShowDetail();
      var hash = (global.location.hash || '').replace(/^#/, '');
      if (hash.indexOf('detail-') === 0) bind(hash);
    });
  }

  global.MdzEstimator = { bind: bind, calculate: calculate };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  wrapShowDetail();
})(typeof window !== 'undefined' ? window : globalThis);
