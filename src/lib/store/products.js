export const products = [
  {
    slug: "aero-phone-ultra",
    name: "Aero Phone Ultra",
    category: "Mobile",
    price: 949,
    compareAtPrice: 1099,
    badge: "Best seller",
    rating: 4.9,
    reviews: 248,
    shortDescription:
      "A flagship phone with a vivid OLED display, pro-grade cameras, and all-day battery life.",
    description:
      "The Aero Phone Ultra is built for people who want a premium mobile experience without a complicated setup. It combines fast performance, a bright display, and reliable cameras in a slim chassis that feels easy to carry every day.",
    accent: "from-cyan-400/30 via-sky-500/20 to-slate-900",
    features: [
      "6.8-inch 120Hz OLED display",
      "Triple camera array with night mode",
      "12GB RAM and 512GB storage",
      "5,000mAh battery with fast charging",
    ],
    inStock: true,
    stockCount: 12,
  },
  {
    slug: "aero-phone-mini",
    name: "Aero Phone Mini",
    category: "Mobile",
    price: 599,
    compareAtPrice: 699,
    badge: "Compact",
    rating: 4.7,
    reviews: 174,
    shortDescription:
      "A smaller phone with a fast chip, dependable cameras, and one-hand comfort.",
    description:
      "Aero Phone Mini keeps the essentials focused and simple. It is a strong fit for buyers who want a clean mobile device with great battery life, fast day-to-day performance, and a comfortable form factor.",
    accent: "from-emerald-400/25 via-cyan-500/15 to-slate-900",
    features: [
      "6.1-inch AMOLED display",
      "Dual cameras with portrait mode",
      "8GB RAM and 256GB storage",
      "IP68 water resistance",
    ],
    inStock: true,
    stockCount: 20,
  },
  {
    slug: "nova-book-14",
    name: "NovaBook 14",
    category: "PC",
    price: 1199,
    compareAtPrice: 1349,
    badge: "Workhorse",
    rating: 4.8,
    reviews: 191,
    shortDescription:
      "A lightweight laptop for work, study, and everyday creative tasks.",
    description:
      "NovaBook 14 balances portability with enough power to handle work, browsing, streaming, and light content creation. It ships with a crisp display, an efficient processor, and a comfortable keyboard for long sessions.",
    accent: "from-indigo-400/25 via-sky-500/15 to-slate-900",
    features: [
      "14-inch QHD display",
      "16GB RAM and 1TB SSD",
      "Aluminum chassis under 1.4kg",
      "All-day battery life",
    ],
    inStock: true,
    stockCount: 9,
  },
  {
    slug: "vector-tower-rtx",
    name: "Vector Tower RTX",
    category: "PC",
    price: 1899,
    compareAtPrice: 2199,
    badge: "Gaming PC",
    rating: 5,
    reviews: 87,
    shortDescription:
      "A ready-to-play desktop tower for gaming, editing, and high-frame-rate performance.",
    description:
      "Vector Tower RTX is designed for buyers who want a practical desktop that can handle modern games and creative workloads without extra setup work. It ships assembled, tuned, and ready to plug in.",
    accent: "from-violet-400/20 via-cyan-500/10 to-slate-900",
    features: [
      "RTX-class graphics",
      "32GB RAM and 2TB SSD",
      "Mesh airflow case",
      "Wi-Fi 6 and Bluetooth 5.3",
    ],
    inStock: true,
    stockCount: 5,
  },
  {
    slug: "playbox-x",
    name: "PlayBox X",
    category: "Console",
    price: 549,
    compareAtPrice: 599,
    badge: "Console",
    rating: 4.9,
    reviews: 332,
    shortDescription:
      "A next-gen gaming console with quick load times and a simple living-room setup.",
    description:
      "PlayBox X is a straightforward console choice for households that want great gaming without the complexity of a full PC setup. It is built for fast resumes, smooth 4K output, and easy controller pairing.",
    accent: "from-amber-400/20 via-rose-500/15 to-slate-900",
    features: [
      "4K gaming output",
      "1TB storage",
      "Quick resume support",
      "Includes wireless controller",
    ],
    inStock: true,
    stockCount: 18,
  },
  {
    slug: "pulsebuds-pro",
    name: "PulseBuds Pro",
    category: "Accessories",
    price: 179,
    compareAtPrice: 229,
    badge: "Accessory",
    rating: 4.6,
    reviews: 156,
    shortDescription:
      "Wireless earbuds with active noise cancellation and a charging case that lasts all week.",
    description:
      "PulseBuds Pro rounds out the store with a practical audio accessory for travel, calls, and daily listening. They pair quickly, fit comfortably, and give buyers a lower-cost add-on at checkout.",
    accent: "from-fuchsia-400/20 via-cyan-500/10 to-slate-900",
    features: [
      "Active noise cancellation",
      "24-hour battery with case",
      "Voice-call beamforming mics",
      "Sweat and splash resistant",
    ],
    inStock: true,
    stockCount: 31,
  },
];

export function getProducts() {
  return products;
}

export function getFeaturedProducts() {
  return products.slice(0, 4);
}

export function getStoreCategories() {
  return ["All", ...new Set(products.map((product) => product.category))];
}

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product, limit = 3) {
  return products
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, limit);
}
