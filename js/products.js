/**
 * Shared product catalog schema for Mondelez wholesale portal.
 * Other agents depend on window.PRODUCTS and the helper APIs below.
 */
(function (global) {
  "use strict";

  global.PRODUCTS = [
    {
      id: "wave-tee",
      sku: "MDZ-TEE-WAVE-001",
      name: "Wave Unisex Tee (Two Colorways)",
      brand: "Mondelez International",
      category: ["tees", "tops"],
      description:
        "Heavyweight cotton jersey with diagonal wave color block and stylized M chest mark. Available in white/purple and purple/white. Relaxed unisex fit for campus and event wear.",
      image: "photos/1 unisex tee.jpg",
      images: ["photos/1 unisex tee.jpg"],
      featured: true,
      newest: true,
      leadWeeks: 6,
      decoration: ["screen-print"],
      colors: [
        {
          id: "white-purple",
          name: "White/Purple",
          hex: "#FFFFFF",
          accent: "#502172",
          pms: "268 C",
          image: "photos/1 unisex tee.jpg",
          skuSuffix: "W",
        },
        {
          id: "purple-white",
          name: "Purple/White",
          hex: "#502172",
          accent: "#FFFFFF",
          pms: "268 C",
          image: "photos/1 unisex tee.jpg",
          skuSuffix: "P",
        },
      ],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      priceBreaks: [
        { minQty: 100, price: 16.8 },
        { minQty: 250, price: 14.2 },
        { minQty: 500, price: 11.75 },
        { minQty: 1000, price: 9.4 },
      ],
      weightOz: 7.2,
      stock: { XS: 120, S: 340, M: 510, L: 480, XL: 220, "2XL": 90, "3XL": 40 },
      detailId: "detail-wave-tee",
    },
    {
      id: "beanie",
      sku: "MDZ-BNI-RIB-002",
      name: "Ribbed Cuff Beanie",
      brand: "Mondelez International",
      category: ["headwear"],
      description:
        "Off-white rib-knit beanie with fold-over cuff and embroidered Mondelez International wordmark in brand purple. One-size winter staple for field teams and gifting.",
      image: "photos/Beanie.jpg",
      images: ["photos/Beanie.jpg"],
      featured: true,
      newest: true,
      leadWeeks: 6,
      decoration: ["embroidery"],
      colors: [
        {
          id: "off-white",
          name: "Off-White",
          hex: "#F2F0EB",
          accent: "#502172",
          pms: "Cool Gray 1 C",
          image: "photos/Beanie.jpg",
          skuSuffix: "OW",
        },
      ],
      sizes: ["OSFA"],
      priceBreaks: [
        { minQty: 100, price: 11.5 },
        { minQty: 250, price: 9.8 },
        { minQty: 500, price: 8.25 },
        { minQty: 1000, price: 6.9 },
      ],
      weightOz: 3.0,
      stock: { OSFA: 860 },
      detailId: "detail-beanie",
    },
    {
      id: "dress-shirt",
      sku: "MDZ-SHT-DRS-003",
      name: "Men's Branded Dress Shirt",
      brand: "Mondelez International",
      category: ["woven"],
      description:
        "Slim-fit black long-sleeve shirt with point collar and white Mondelez International chest logo. Stretch cotton blend for trade shows and client-facing roles.",
      image: "photos/mens dress shirt black.jpg",
      images: ["photos/mens dress shirt black.jpg"],
      featured: false,
      newest: false,
      leadWeeks: 8,
      decoration: ["heat-transfer"],
      colors: [
        {
          id: "matte-black",
          name: "Matte Black",
          hex: "#0A0A0A",
          accent: "#FFFFFF",
          pms: "Black 6 C",
          image: "photos/mens dress shirt black.jpg",
          skuSuffix: "BK",
        },
      ],
      sizes: ["14.5", "15", "15.5", "16", "16.5", "17", "17.5", "18", "18.5"],
      priceBreaks: [
        { minQty: 100, price: 38.5 },
        { minQty: 250, price: 32.8 },
        { minQty: 500, price: 27.6 },
        { minQty: 1000, price: 23.4 },
      ],
      weightOz: 8.5,
      stock: {
        "14.5": 40,
        "15": 95,
        "15.5": 140,
        "16": 180,
        "16.5": 160,
        "17": 110,
        "17.5": 70,
        "18": 45,
        "18.5": 25,
      },
      detailId: "detail-dress-shirt",
    },
    {
      id: "satin-blouse",
      sku: "MDZ-BLS-SLK-004",
      name: "Executive Satin Blouse & Silk Scarf Set",
      brand: "Mondelez International",
      category: ["woven", "accessories"],
      description:
        "Royal purple satin button-down with gold-tone cuff buttons, paired with a 90cm square silk twill scarf in brand purple, black, and white.",
      image: "photos/Silk Shirt With scarf b V2.jpg",
      images: ["photos/Silk Shirt With scarf b V2.jpg"],
      featured: true,
      newest: false,
      leadWeeks: 10,
      decoration: ["screen-print", "digital-print"],
      colors: [
        {
          id: "royal-purple",
          name: "Royal Purple",
          hex: "#502172",
          accent: "#FFFFFF",
          pms: "268 C",
          image: "photos/Silk Shirt With scarf b V2.jpg",
          skuSuffix: "RP",
        },
      ],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      priceBreaks: [
        { minQty: 100, price: 62.0 },
        { minQty: 250, price: 52.5 },
        { minQty: 500, price: 44.8 },
        { minQty: 1000, price: 38.2 },
      ],
      weightOz: 10.5,
      stock: { XS: 55, S: 120, M: 150, L: 130, XL: 80, "2XL": 40 },
      detailId: "detail-satin-blouse",
    },
    {
      id: "track-jacket",
      sku: "MDZ-JKT-TRK-005",
      name: "Color-Block Track Jacket",
      brand: "Mondelez International",
      category: ["outerwear"],
      description:
        "Water-repellent polyester track jacket with purple, black, and white panels. Matching cap and track pants available as coordinated SKUs.",
      image: "photos/Water Repellent Padded Jacket.jpg",
      images: ["photos/Water Repellent Padded Jacket.jpg"],
      featured: false,
      newest: true,
      leadWeeks: 8,
      decoration: ["heat-transfer"],
      colors: [
        {
          id: "color-block",
          name: "Purple/Black/White",
          hex: "#502172",
          accent: "#000000",
          pms: "268 C",
          image: "photos/Water Repellent Padded Jacket.jpg",
          skuSuffix: "CB",
        },
      ],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      priceBreaks: [
        { minQty: 50, price: 58.0 },
        { minQty: 100, price: 49.5 },
        { minQty: 250, price: 42.2 },
        { minQty: 500, price: 36.8 },
      ],
      weightOz: 14.0,
      stock: { XS: 35, S: 90, M: 120, L: 110, XL: 70, "2XL": 30 },
      detailId: "detail-track-jacket",
    },
    {
      id: "puffer-jacket",
      sku: "MDZ-JKT-PFF-006",
      name: "Women's Lightweight Puffer Jacket",
      brand: "Mondelez International",
      category: ["outerwear"],
      description:
        "Quilted black body with purple hood, sleeves, and side panels. Branded zipper pulls and left-chest logo. Hip-length transitional outerwear.",
      image: "photos/Womens Puffer Jacket.jpg",
      images: ["photos/Womens Puffer Jacket.jpg"],
      featured: false,
      newest: false,
      leadWeeks: 10,
      decoration: ["screen-print"],
      colors: [
        {
          id: "black-purple",
          name: "Black/Purple",
          hex: "#0A0A0A",
          accent: "#502172",
          pms: "268 C",
          image: "photos/Womens Puffer Jacket.jpg",
          skuSuffix: "BP",
        },
      ],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      priceBreaks: [
        { minQty: 50, price: 68.0 },
        { minQty: 100, price: 57.5 },
        { minQty: 250, price: 48.9 },
        { minQty: 500, price: 41.6 },
      ],
      weightOz: 13.4,
      stock: { XS: 40, S: 95, M: 130, L: 100, XL: 60, "2XL": 25 },
      detailId: "detail-puffer-jacket",
    },
  ];

  global.CATEGORIES = [
    {
      id: "all",
      label: "All Styles",
      match: function () {
        return true;
      },
    },
    {
      id: "tees",
      label: "T-Shirts & Tops",
      match: function (product) {
        return (
          product.category.indexOf("tees") !== -1 ||
          product.category.indexOf("tops") !== -1
        );
      },
    },
    {
      id: "woven",
      label: "Woven & Dress Shirts",
      match: function (product) {
        return product.category.indexOf("woven") !== -1;
      },
    },
    {
      id: "outerwear",
      label: "Outerwear",
      match: function (product) {
        return product.category.indexOf("outerwear") !== -1;
      },
    },
    {
      id: "headwear",
      label: "Headwear",
      match: function (product) {
        return product.category.indexOf("headwear") !== -1;
      },
    },
    {
      id: "accessories",
      label: "Accessories",
      match: function (product) {
        return product.category.indexOf("accessories") !== -1;
      },
    },
  ];

  global.getProductById = function getProductById(id) {
    if (!id) return null;
    for (var i = 0; i < global.PRODUCTS.length; i++) {
      if (global.PRODUCTS[i].id === id) return global.PRODUCTS[i];
    }
    return null;
  };

  global.getProductBySku = function getProductBySku(sku) {
    if (!sku) return null;
    var needle = String(sku).trim().toUpperCase();
    for (var i = 0; i < global.PRODUCTS.length; i++) {
      var product = global.PRODUCTS[i];
      var base = String(product.sku).toUpperCase();
      if (base === needle) return product;
      var colors = product.colors || [];
      for (var c = 0; c < colors.length; c++) {
        var suffix = colors[c].skuSuffix || "";
        if ((base + String(suffix).toUpperCase()) === needle) return product;
      }
    }
    return null;
  };

  global.priceForQty = function priceForQty(product, qty) {
    if (!product || !product.priceBreaks || !product.priceBreaks.length) {
      return null;
    }
    var quantity = Number(qty) || 0;
    var breaks = product.priceBreaks.slice().sort(function (a, b) {
      return a.minQty - b.minQty;
    });
    var unit = breaks[0].price;
    for (var i = 0; i < breaks.length; i++) {
      if (quantity >= breaks[i].minQty) unit = breaks[i].price;
    }
    return unit;
  };
})(typeof window !== "undefined" ? window : globalThis);
