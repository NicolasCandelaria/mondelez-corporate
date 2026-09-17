/**
 * Mondelez quote cart — Tier 1 items 10–12
 * localStorage key: mdz-quote-cart
 * API: window.MdzCart
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdz-quote-cart';
  var lines = [];

  function money(n) {
    return (
      '$' +
      Number(n || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  function defaultSize(product) {
    var sizes = (product && product.sizes) || [];
    if (!sizes.length) return 'OS';
    if (sizes.indexOf('M') !== -1) return 'M';
    if (sizes.indexOf('OS') !== -1) return 'OS';
    return sizes[0];
  }

  function lineKey(productId, colorId, size) {
    return [productId || '', colorId || '', size || ''].join('|');
  }

  function resolveColor(product, colorId) {
    var colors = (product && product.colors) || [];
    if (!colors.length) return { id: colorId || 'default', name: 'Standard', skuSuffix: '' };
    if (colorId) {
      for (var i = 0; i < colors.length; i++) {
        if (colors[i].id === colorId) return colors[i];
      }
    }
    return colors[0];
  }

  function colorSku(product, color) {
    var suffix = color && color.skuSuffix != null ? String(color.skuSuffix) : '';
    return product.sku + suffix;
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        lines = [];
        return;
      }
      var parsed = JSON.parse(raw);
      lines = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      lines = [];
    }
  }

  function persist() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch (err) {
      /* ignore quota */
    }
    updateBadge();
    renderQuotePage();
    global.dispatchEvent(new CustomEvent('mdz:cart-changed', { detail: { cart: getCart() } }));
  }

  function getCart() {
    return lines.slice();
  }

  /** Badge count = total units in cart */
  function getCount() {
    return lines.reduce(function (sum, line) {
      return sum + (Number(line.qty) || 0);
    }, 0);
  }

  function getSubtotal() {
    return lines.reduce(function (sum, line) {
      return sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
    }, 0);
  }

  function refreshLinePrices() {
    var byProduct = {};
    lines.forEach(function (line) {
      byProduct[line.productId] = (byProduct[line.productId] || 0) + (Number(line.qty) || 0);
    });
    lines.forEach(function (line) {
      var product = global.getProductById && global.getProductById(line.productId);
      if (product && global.priceForQty) {
        line.unitPrice = global.priceForQty(product, byProduct[line.productId] || line.qty);
      }
    });
  }

  function addLines(input) {
    if (!input) return getCart();

    var productId = input.productId;
    var unitPriceOverride =
      typeof input.unitPrice === 'number' ? input.unitPrice : null;
    var incoming = [];

    if (Array.isArray(input.lines)) {
      incoming = input.lines;
    } else if (input.colorId != null || input.size != null || input.qty != null) {
      incoming = [
        {
          colorId: input.colorId,
          size: input.size,
          qty: input.qty
        }
      ];
    } else if (Array.isArray(input)) {
      incoming = input;
      productId = incoming[0] && incoming[0].productId;
    }

    var product = global.getProductById && global.getProductById(productId);
    if (!product) return getCart();

    incoming.forEach(function (row) {
      var qty = Math.max(0, parseInt(row.qty, 10) || 0);
      if (!qty) return;
      var color = resolveColor(product, row.colorId);
      var size = row.size || defaultSize(product);
      var key = lineKey(product.id, color.id, size);
      var existing = null;
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].key === key) {
          existing = lines[i];
          break;
        }
      }
      if (existing) {
        existing.qty = (Number(existing.qty) || 0) + qty;
      } else {
        lines.push({
          key: key,
          productId: product.id,
          sku: colorSku(product, color),
          name: product.name,
          colorId: color.id,
          colorName: color.name || 'Standard',
          size: size,
          qty: qty,
          unitPrice:
            unitPriceOverride != null
              ? unitPriceOverride
              : global.priceForQty
                ? global.priceForQty(product, qty)
                : 0
        });
      }
    });

    refreshLinePrices();
    persist();
    return getCart();
  }

  function updateQty(key, qty) {
    var q = Math.max(0, parseInt(qty, 10) || 0);
    var next = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].key === key) {
        if (q > 0) {
          lines[i].qty = q;
          next.push(lines[i]);
        }
      } else {
        next.push(lines[i]);
      }
    }
    lines = next;
    refreshLinePrices();
    persist();
    return getCart();
  }

  function removeLine(key) {
    lines = lines.filter(function (line) {
      return line.key !== key;
    });
    refreshLinePrices();
    persist();
    return getCart();
  }

  function clear() {
    lines = [];
    persist();
    return getCart();
  }

  function updateBadge() {
    var badge = document.querySelector('.cart-badge');
    if (badge) badge.textContent = String(getCount());
  }

  function renderQuotePage() {
    var page = document.getElementById('page-quote');
    if (!page) return;

    var tbody = page.querySelector('#quote-cart-body');
    var empty = page.querySelector('#quote-empty');
    var summary = page.querySelector('.quote-summary');
    var form = page.querySelector('form');

    if (!tbody) return;

    if (!lines.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
      page.querySelector('.data-table-wrap') &&
        (page.querySelector('.data-table-wrap').style.display = 'none');
      if (summary) summary.style.display = 'none';
      if (form) form.style.display = 'none';
      return;
    }

    if (empty) empty.hidden = true;
    var wrap = page.querySelector('.data-table-wrap');
    if (wrap) wrap.style.display = '';
    if (summary) summary.style.display = '';
    if (form) form.style.display = '';

    tbody.innerHTML = lines
      .map(function (line) {
        var total = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
        var label =
          line.name +
          ' <span style="color:var(--ink-soft);font-weight:400;">(' +
          escapeHtml(line.colorName) +
          ' / ' +
          escapeHtml(line.size) +
          ')</span>';
        return (
          '<tr data-key="' +
          escapeAttr(line.key) +
          '">' +
          '<td>' +
          escapeHtml(line.sku) +
          '</td>' +
          '<td>' +
          label +
          '</td>' +
          '<td><input type="number" class="quote-qty" min="1" value="' +
          escapeAttr(String(line.qty)) +
          '" style="width:80px;padding:6px;"></td>' +
          '<td>' +
          money(line.unitPrice) +
          '</td>' +
          '<td>' +
          money(total) +
          '</td>' +
          '<td><a href="#" class="quote-remove">Remove</a></td>' +
          '</tr>'
        );
      })
      .join('');

    var units = getCount();
    var subtotal = getSubtotal();
    var freight = lines.length ? Math.max(75, Math.round(units * 0.45 * 100) / 100) : 0;
    var setup = lines.length * 175;
    var estimated = subtotal + freight + setup;

    if (summary) {
      summary.innerHTML =
        '<h3>Quote Summary</h3>' +
        '<div class="quote-line"><span>Subtotal (' +
        units.toLocaleString('en-US') +
        ' units)</span><span>' +
        money(subtotal) +
        '</span></div>' +
        '<div class="quote-line"><span>Est. Freight (landed to NJ DC)</span><span>' +
        money(freight) +
        '</span></div>' +
        '<div class="quote-line"><span>Decoration setup (' +
        lines.length +
        ' line' +
        (lines.length === 1 ? '' : 's') +
        ')</span><span>' +
        money(setup) +
        '</span></div>' +
        '<div class="quote-line total"><span>Estimated Total (USD)</span><span>' +
        money(estimated) +
        '</span></div>';
    }
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

  function addDefaultForProduct(productId) {
    var product = global.getProductById && global.getProductById(productId);
    if (!product) return;
    var color = (product.colors && product.colors[0]) || { id: 'default', name: 'Standard' };
    var size = defaultSize(product);
    var minQty =
      product.priceBreaks && product.priceBreaks[0]
        ? product.priceBreaks[0].minQty
        : 100;
    addLines({
      productId: product.id,
      lines: [{ colorId: color.id, size: size, qty: minQty }]
    });
  }

  function goQuote() {
    if (typeof global.showPage === 'function') global.showPage('quote');
    else (global.location.hash = 'quote');
  }

  function handleAddToQuoteEvent(e) {
    var detail = (e && e.detail) || {};
    addLines(detail);
    goQuote();
  }

  function bindQuotePage() {
    var page = document.getElementById('page-quote');
    if (!page || page.dataset.cartBound === '1') return;
    page.dataset.cartBound = '1';

    page.addEventListener('change', function (e) {
      var input = e.target.closest('.quote-qty');
      if (!input) return;
      var row = input.closest('tr[data-key]');
      if (!row) return;
      updateQty(row.getAttribute('data-key'), input.value);
    });

    page.addEventListener('click', function (e) {
      var link = e.target.closest('.quote-remove');
      if (!link) return;
      e.preventDefault();
      var row = link.closest('tr[data-key]');
      if (!row) return;
      removeLine(row.getAttribute('data-key'));
    });
  }

  function bindCatalogQuotes() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add-quote]');
      if (!btn) return;
      e.preventDefault();
      var productId = btn.getAttribute('data-add-quote');
      if (!productId) return;
      addDefaultForProduct(productId);
      goQuote();
    });
  }

  function resolveQuickOrderRow(skuInput, qtyInput) {
    var sku = (skuInput.value || '').trim();
    if (!sku) return { empty: true };
    var product = global.getProductBySku && global.getProductBySku(sku);
    if (!product) return { invalid: true, sku: sku };
    var color =
      (global.getColorForSku && global.getColorForSku(product, sku)) ||
      resolveColor(product, null);
    var qty = parseInt(qtyInput.value, 10);
    if (!qty || qty < 1) qty = 100;
    return {
      productId: product.id,
      colorId: color.id,
      size: defaultSize(product),
      qty: qty,
      unitPrice: global.priceForQty ? global.priceForQty(product, qty) : 0
    };
  }

  function bindQuickOrder() {
    var page = document.getElementById('page-quick-order');
    if (!page || page.dataset.cartBound === '1') return;
    page.dataset.cartBound = '1';

    var form = page.querySelector('#quick-order-form') || page.querySelector('form');
    if (!form) return;

    var addRowBtn = page.querySelector('[data-quick-add-row]');
    if (addRowBtn) {
      addRowBtn.addEventListener('click', function () {
        var tbody = form.querySelector('tbody');
        if (!tbody) return;
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><input type="text" class="qo-sku" placeholder="SKU" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:4px;"></td>' +
          '<td><input type="number" class="qo-qty" value="100" min="1" style="width:100px;padding:8px;border:1px solid var(--line);border-radius:4px;"></td>' +
          '<td class="qo-msg"></td>';
        tbody.appendChild(tr);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var rows = form.querySelectorAll('tbody tr');
      var toAdd = [];
      var hasError = false;
      var msgEl = page.querySelector('#quick-order-message');

      rows.forEach(function (tr) {
        var skuInput = tr.querySelector('.qo-sku') || tr.querySelector('input[type="text"]');
        var qtyInput = tr.querySelector('.qo-qty') || tr.querySelector('input[type="number"]');
        if (!skuInput || !qtyInput) return;
        tr.classList.remove('sku-invalid');
        var msgCell = tr.querySelector('.qo-msg');
        if (msgCell) msgCell.textContent = '';

        var result = resolveQuickOrderRow(skuInput, qtyInput);
        if (result.empty) return;
        if (result.invalid) {
          hasError = true;
          tr.classList.add('sku-invalid');
          if (msgCell) msgCell.textContent = 'Unknown SKU';
          return;
        }
        toAdd.push(result);
      });

      if (hasError) {
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.textContent = 'Fix highlighted SKUs before adding to the quote cart.';
        }
        return;
      }

      if (!toAdd.length) {
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.textContent = 'Enter at least one SKU to continue.';
        }
        return;
      }

      if (msgEl) {
        msgEl.hidden = true;
        msgEl.textContent = '';
      }

      toAdd.forEach(function (item) {
        addLines({
          productId: item.productId,
          colorId: item.colorId,
          size: item.size,
          qty: item.qty,
          unitPrice: item.unitPrice
        });
      });

      goQuote();
    });
  }

  function wrapShowPage() {
    if (typeof global.showPage !== 'function') return;
    if (global.showPage.__mdzCartWrapped) return;
    var original = global.showPage;
    function wrapped(page) {
      original(page);
      if (page === 'quote') renderQuotePage();
    }
    wrapped.__mdzCartWrapped = true;
    global.showPage = wrapped;
  }

  function init() {
    load();
    bindQuotePage();
    bindCatalogQuotes();
    bindQuickOrder();
    wrapShowPage();
    updateBadge();
    renderQuotePage();
  }

  global.MdzCart = {
    addLines: addLines,
    updateQty: updateQty,
    removeLine: removeLine,
    clear: clear,
    getCart: getCart,
    getCount: getCount,
    getSubtotal: getSubtotal,
    addDefaultForProduct: addDefaultForProduct,
    render: renderQuotePage,
    STORAGE_KEY: STORAGE_KEY
  };

  global.addEventListener('mdz:add-to-quote', handleAddToQuoteEvent);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
