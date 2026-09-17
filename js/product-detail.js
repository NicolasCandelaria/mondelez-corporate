/**
 * PDP: colour swatches, size×colour qty grid, live tier pricing, Add to Quote.
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

  var state = {
    detailId: null,
    product: null,
    selectedColorId: null,
    qtys: {} // key: colorId|size -> number
  };

  function money(n) {
    return (
      '$' +
      Number(n || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  function formatQtyLabel(minQty, nextMin) {
    var start = Number(minQty).toLocaleString('en-US');
    if (nextMin == null) return start + '+';
    var end = (Number(nextMin) - 1).toLocaleString('en-US');
    return start + ' to ' + end;
  }

  function cellKey(colorId, size) {
    return colorId + '|' + size;
  }

  function getQty(colorId, size) {
    var v = state.qtys[cellKey(colorId, size)];
    return v > 0 ? v : 0;
  }

  function setQty(colorId, size, value) {
    var n = parseInt(value, 10);
    if (isNaN(n) || n < 0) n = 0;
    state.qtys[cellKey(colorId, size)] = n;
  }

  function grandTotal() {
    var total = 0;
    Object.keys(state.qtys).forEach(function (k) {
      total += state.qtys[k] || 0;
    });
    return total;
  }

  function rowTotal(colorId) {
    var product = state.product;
    if (!product) return 0;
    var sum = 0;
    (product.sizes || []).forEach(function (size) {
      sum += getQty(colorId, size);
    });
    return sum;
  }

  function collectLines() {
    var product = state.product;
    var lines = [];
    if (!product) return lines;
    (product.colors || []).forEach(function (color) {
      (product.sizes || []).forEach(function (size) {
        var qty = getQty(color.id, size);
        if (qty > 0) {
          lines.push({ colorId: color.id, size: size, qty: qty });
        }
      });
    });
    return lines;
  }

  function activeBreakIndex(product, qty) {
    if (!product || !product.priceBreaks || !product.priceBreaks.length) return -1;
    var breaks = product.priceBreaks.slice().sort(function (a, b) {
      return a.minQty - b.minQty;
    });
    var idx = -1;
    for (var i = 0; i < breaks.length; i++) {
      if (qty >= breaks[i].minQty) idx = i;
    }
    return idx;
  }

  function selectedColor() {
    var product = state.product;
    if (!product || !product.colors || !product.colors.length) return null;
    return (
      product.colors.find(function (c) {
        return c.id === state.selectedColorId;
      }) || product.colors[0]
    );
  }

  function colorSku(product, color) {
    return product.sku + (color && color.skuSuffix ? color.skuSuffix : '');
  }

  function ensurePanel(detailEl) {
    var info = detailEl.querySelector('.detail-info');
    if (!info) return null;

    // Keep a single #pdp-order-panel id on the active detail only
    document.querySelectorAll('#pdp-order-panel').forEach(function (el) {
      el.removeAttribute('id');
    });

    var existing = detailEl.querySelector('.pdp-order-panel');
    if (existing) {
      existing.id = 'pdp-order-panel';
      return existing;
    }

    var panel = document.createElement('div');
    panel.id = 'pdp-order-panel';
    panel.className = 'pdp-order-panel';

    var pricing = info.querySelector('.pricing');
    if (pricing) {
      pricing.replaceWith(panel);
    } else {
      var lead = info.querySelector('p.lead');
      if (lead && lead.nextSibling) {
        info.insertBefore(panel, lead.nextSibling);
      } else {
        info.appendChild(panel);
      }
    }
    return panel;
  }

  function renderSwatches(product) {
    var color = selectedColor();
    var swatches = (product.colors || [])
      .map(function (c) {
        var active = color && c.id === color.id ? ' is-active' : '';
        var border =
          c.hex && c.hex.toLowerCase() === '#ffffff'
            ? 'border:1px solid #ccc;'
            : '';
        return (
          '<button type="button" class="pdp-swatch' +
          active +
          '" data-color-id="' +
          c.id +
          '" title="' +
          escapeHtml(c.name) +
          '" aria-label="' +
          escapeHtml(c.name) +
          '" style="background:' +
          (c.hex || '#ccc') +
          ';' +
          border +
          '"></button>'
        );
      })
      .join('');

    return (
      '<div class="pdp-swatch-block">' +
      '<div class="pdp-swatch-label">Colourways</div>' +
      '<div class="pdp-swatches" role="list">' +
      swatches +
      '</div>' +
      '<p class="pdp-selected-meta" data-pdp-selected-meta>' +
      selectedMetaText(product, color) +
      '</p>' +
      '</div>'
    );
  }

  function selectedMetaText(product, color) {
    if (!color) return '';
    return (
      'Selected: <strong>' +
      escapeHtml(color.name) +
      '</strong> · SKU: <span class="pdp-sku">' +
      escapeHtml(colorSku(product, color)) +
      '</span>'
    );
  }

  function renderPricingTable(product, qty) {
    var breaks = (product.priceBreaks || []).slice().sort(function (a, b) {
      return a.minQty - b.minQty;
    });
    var activeIdx = activeBreakIndex(product, qty);
    var rows = breaks
      .map(function (b, i) {
        var next = breaks[i + 1] ? breaks[i + 1].minQty : null;
        var active = i === activeIdx ? ' class="is-active-tier"' : '';
        var totalLabel =
          next == null
            ? 'Contact for quote'
            : 'From ' + money(b.minQty * b.price);
        return (
          '<tr' +
          active +
          ' data-tier-index="' +
          i +
          '">' +
          '<td>' +
          formatQtyLabel(b.minQty, next) +
          '</td>' +
          '<td class="price-cell">' +
          money(b.price) +
          '</td>' +
          '<td>' +
          totalLabel +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<div class="pricing pdp-pricing">' +
      '<h3>Pricing Tiers <span class="currency-note">USD</span></h3>' +
      '<table>' +
      '<thead><tr><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead>' +
      '<tbody data-pdp-tiers>' +
      rows +
      '</tbody>' +
      '</table>' +
      '</div>'
    );
  }

  function renderQtyGrid(product) {
    var sizes = product.sizes || [];
    var head =
      '<th scope="col">Colour</th>' +
      sizes
        .map(function (s) {
          return '<th scope="col">' + escapeHtml(s) + '</th>';
        })
        .join('') +
      '<th scope="col">Row total</th>';

    var body = (product.colors || [])
      .map(function (color) {
        var cells = sizes
          .map(function (size) {
            var qty = getQty(color.id, size);
            var stock =
              product.stock && product.stock[size] != null
                ? product.stock[size]
                : null;
            var title =
              stock != null ? ' title="Stock: ' + stock + '"' : '';
            return (
              '<td>' +
              '<input type="number" class="pdp-qty-input" min="0" step="1"' +
              title +
              ' data-color-id="' +
              escapeAttr(color.id) +
              '" data-size="' +
              escapeAttr(size) +
              '" value="' +
              (qty || '') +
              '" aria-label="' +
              escapeAttr(color.name + ' ' + size + ' quantity') +
              '">' +
              '</td>'
            );
          })
          .join('');
        return (
          '<tr data-color-row="' +
          escapeAttr(color.id) +
          '">' +
          '<td class="pdp-color-name">' +
          '<span class="pdp-color-dot" style="background:' +
          (color.hex || '#ccc') +
          '"></span>' +
          escapeHtml(color.name) +
          '</td>' +
          cells +
          '<td class="pdp-row-total" data-row-total="' +
          escapeAttr(color.id) +
          '">' +
          rowTotal(color.id) +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<div class="pdp-grid-block">' +
      '<h3>Order quantities</h3>' +
      '<p class="pdp-grid-hint">Enter units by colourway and size. Totals and tier pricing update live.</p>' +
      '<div class="pdp-grid-scroll">' +
      '<table class="pdp-qty-grid">' +
      '<thead><tr>' +
      head +
      '</tr></thead>' +
      '<tbody>' +
      body +
      '</tbody>' +
      '</table>' +
      '</div>' +
      '</div>'
    );
  }

  function renderTotals(product, qty) {
    var unit =
      typeof global.priceForQty === 'function'
        ? global.priceForQty(product, qty)
        : 0;
    var extended = unit * qty;
    return (
      '<div class="pdp-totals" data-pdp-totals>' +
      '<div class="pdp-total-row"><span>Total units</span><strong data-pdp-grand>' +
      qty +
      '</strong></div>' +
      '<div class="pdp-total-row"><span>Unit price</span><strong data-pdp-unit>' +
      money(unit) +
      '</strong></div>' +
      '<div class="pdp-total-row pdp-extended"><span>Extended total</span><strong data-pdp-extended>' +
      money(extended) +
      '</strong></div>' +
      '</div>'
    );
  }

  function renderPanelHtml(product) {
    var qty = grandTotal();
    return (
      renderSwatches(product) +
      renderPricingTable(product, qty) +
      '<div id="oe-mount" class="oe-mount" aria-live="polite"></div>'
    );
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

  function updateMainImage(detailEl, color) {
    if (!color || !color.image) return;
    var img = detailEl.querySelector('.detail-image img');
    if (img) {
      img.src = color.image;
      img.alt = (state.product ? state.product.name + ' — ' : '') + color.name;
    }
    var skuEl = detailEl.querySelector('.detail-info > .sku');
    if (skuEl && state.product) {
      skuEl.textContent = 'SKU: ' + colorSku(state.product, color);
    }
  }

  function updateLiveTotals(panel) {
    var product = state.product;
    if (!product || !panel) return;
    var qty = grandTotal();
    var unit =
      typeof global.priceForQty === 'function'
        ? global.priceForQty(product, qty)
        : 0;

    (product.colors || []).forEach(function (color) {
      var cell = panel.querySelector('[data-row-total="' + color.id + '"]');
      if (cell) cell.textContent = String(rowTotal(color.id));
    });

    var grand = panel.querySelector('[data-pdp-grand]');
    var unitEl = panel.querySelector('[data-pdp-unit]');
    var extEl = panel.querySelector('[data-pdp-extended]');
    if (grand) grand.textContent = String(qty);
    if (unitEl) unitEl.textContent = money(unit);
    if (extEl) extEl.textContent = money(unit * qty);

    var breaks = (product.priceBreaks || []).slice().sort(function (a, b) {
      return a.minQty - b.minQty;
    });
    var activeIdx = activeBreakIndex(product, qty);
    panel.querySelectorAll('[data-tier-index]').forEach(function (tr) {
      var i = parseInt(tr.getAttribute('data-tier-index'), 10);
      tr.classList.toggle('is-active-tier', i === activeIdx && qty > 0);
    });
    // When qty is 0, still show first tier softly as reference
    if (qty === 0 && breaks.length) {
      var first = panel.querySelector('[data-tier-index="0"]');
      if (first) first.classList.add('is-active-tier');
    }
  }

  function bindPanelEvents(panel, detailEl) {
    panel.addEventListener('click', function (e) {
      var swatch = e.target.closest('.pdp-swatch');
      if (swatch) {
        var colorId = swatch.getAttribute('data-color-id');
        state.selectedColorId = colorId;
        panel.querySelectorAll('.pdp-swatch').forEach(function (btn) {
          btn.classList.toggle(
            'is-active',
            btn.getAttribute('data-color-id') === colorId
          );
        });
        var color = selectedColor();
        var meta = panel.querySelector('[data-pdp-selected-meta]');
        if (meta && color) {
          meta.innerHTML = selectedMetaText(state.product, color);
        }
        updateMainImage(detailEl, color);
        return;
      }

      if (e.target.closest('[data-pdp-add-quote]')) {
        handleAddToQuote(panel);
      }
    });

    panel.addEventListener('input', function (e) {
      var input = e.target.closest('.pdp-qty-input');
      if (!input) return;
      setQty(
        input.getAttribute('data-color-id'),
        input.getAttribute('data-size'),
        input.value
      );
      updateLiveTotals(panel);
    });

    panel.addEventListener('change', function (e) {
      var input = e.target.closest('.pdp-qty-input');
      if (!input) return;
      var n = parseInt(input.value, 10);
      if (isNaN(n) || n < 0) {
        input.value = '';
        setQty(
          input.getAttribute('data-color-id'),
          input.getAttribute('data-size'),
          0
        );
      }
      updateLiveTotals(panel);
    });
  }

  function handleAddToQuote(panel) {
    var product = state.product;
    if (!product) return;
    var lines = collectLines();
    var qty = grandTotal();
    var unit =
      typeof global.priceForQty === 'function'
        ? global.priceForQty(product, qty)
        : 0;

    var btn = panel.querySelector('[data-pdp-add-quote]');
    if (!lines.length) {
      if (btn) {
        var prev = btn.textContent;
        btn.textContent = 'Enter quantities first';
        setTimeout(function () {
          btn.textContent = prev;
        }, 1600);
      }
      return;
    }

    document.dispatchEvent(
      new CustomEvent('mdz:add-to-quote', {
        detail: {
          productId: product.id,
          lines: lines,
          unitPrice: unit
        }
      })
    );

    if (btn) {
      var label = btn.textContent;
      btn.textContent = 'Added to Quote';
      btn.classList.add('is-added');
      setTimeout(function () {
        btn.textContent = label;
        btn.classList.remove('is-added');
      }, 1600);
    }
  }

  function bindDetail(detailId) {
    var productId = DETAIL_TO_PRODUCT[detailId];
    if (!productId) return;

    var product =
      typeof global.getProductById === 'function'
        ? global.getProductById(productId)
        : null;
    if (!product) return;

    var detailEl = document.getElementById(detailId);
    if (!detailEl) return;

    var resetQtys = state.detailId !== detailId || state.product !== product;
    state.detailId = detailId;
    state.product = product;
    if (resetQtys) {
      state.qtys = {};
      state.selectedColorId =
        product.colors && product.colors[0] ? product.colors[0].id : null;
    }

    var panel = ensurePanel(detailEl);
    if (!panel) return;

    // Re-render when switching products; keep DOM fresh
    panel.innerHTML = renderPanelHtml(product);
    // Clone to drop old listeners when rebinding same panel
    var fresh = panel.cloneNode(true);
    panel.replaceWith(fresh);
    panel = fresh;
    // ensure id remains unique / present
    panel.id = 'pdp-order-panel';

    bindPanelEvents(panel, detailEl);
    updateMainImage(detailEl, selectedColor());
    updateLiveTotals(panel);
  }

  function wrapShowDetail() {
    if (typeof global.showDetail !== 'function') return;
    if (global.showDetail.__mdzPdpWrapped) return;
    var original = global.showDetail;
    function wrapped(id) {
      original(id);
      bindDetail(id);
    }
    wrapped.__mdzPdpWrapped = true;
    global.showDetail = wrapped;
  }

  function init() {
    wrapShowDetail();

    // If a detail is already active (hash routed before this script, or inline), bind it
    var active = document.querySelector('.detail-wrap.active');
    if (active && active.id) {
      bindDetail(active.id);
    }

    // Also catch hash-based opens if wrap missed (e.g. showDetail defined later)
    global.addEventListener('hashchange', function () {
      wrapShowDetail();
      var hash = (global.location.hash || '').replace(/^#/, '');
      if (hash.indexOf('detail-') === 0) {
        bindDetail(hash);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Late wrap: inline script may define showDetail after this file if order wrong;
  // our HTML loads products → product-detail AFTER inline, so also expose API.
  global.MDZ_PDP = {
    bind: bindDetail,
    DETAIL_TO_PRODUCT: DETAIL_TO_PRODUCT
  };

  // If showDetail already exists (script after inline), wrap now
  wrapShowDetail();
})(typeof window !== 'undefined' ? window : globalThis);
