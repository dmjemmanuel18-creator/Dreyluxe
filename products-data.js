export const inventory = [
  {
    id: "item-001",
    slug: "salvation-collection",
    name: "The Salvation Collection",
    type: "T-Shirt",
    price: 16000,
    image: "product-02-salvation-black-front-back.jpg",
    gallery: [
      "product-02-salvation-black-front-back.jpg",
      "photo_2026-05-28_22-16-38.jpg",
      "photo_2026-05-28_22-16-41.jpg"
    ],
    alt: "Black Dreyluxe Salvation collection t-shirt front and back",
    description: "He died so you could live. This is the true essence of love.",
    story: "A bold gospel tee built around the heart of the brand: love, sacrifice, and a life that reflects Christ.",
    colors: ["Black", "White"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    fit: "Relaxed unisex fit",
    availability: "Ready to order",
    features: [
      "Soft everyday cotton feel",
      "Front and back faith-centered graphic",
      "Durable print placement for repeated wear",
      "Clean streetwear silhouette"
    ],
    care: [
      "Wash inside out with mild detergent",
      "Use cold water to protect the print",
      "Do not bleach",
      "Air dry or tumble dry low"
    ]
  },
  {
    id: "item-002",
    slug: "genesis-collection",
    name: "The Genesis Collection",
    type: "T-Shirt",
    price: 13000,
    image: "product-01-created-creative-white.jpg",
    gallery: [
      "product-01-created-creative-white.jpg",
      "product-08-created-creative-white-alt.jpg",
      "photo_2026-05-28_22-16-54.jpg"
    ],
    alt: "White Dreyluxe Created to be a Creative t-shirt",
    description: "We are created to be creative. Everything you create is a show of your Christlike nature.",
    story: "A clean white tee for builders, artists, and believers creating from purpose.",
    colors: ["White", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    fit: "Relaxed unisex fit",
    availability: "Ready to order",
    features: [
      "Premium white tee base",
      "Statement graphic with a clean finish",
      "Easy to layer with denim, cargo, or outerwear",
      "Faith-inspired message for daily wear"
    ],
    care: [
      "Wash with similar colors",
      "Turn inside out before washing",
      "Avoid high heat on the print",
      "Iron inside out if needed"
    ]
  },
  {
    id: "item-003",
    slug: "119-collection",
    name: "The 119 Collection",
    type: "T-Shirt",
    price: 15000,
    image: "product-03-119-black-hanger.jpg",
    gallery: [
      "product-03-119-black-hanger.jpg",
      "photo_2026-05-28_22-17-01.jpg"
    ],
    alt: "Black Dreyluxe 119 collection t-shirt on hanger",
    description: "The Word is our GPS in life. Whenever you feel lost, the Word is our lamp and guide.",
    story: "Inspired by Psalm 119, this tee keeps scripture close without losing the clean streetwear edge.",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    fit: "Relaxed unisex fit",
    availability: "Ready to order",
    features: [
      "Deep black base for a sharp everyday look",
      "Scripture-led graphic concept",
      "Comfortable weight for warm weather",
      "Works as a standalone piece or under jackets"
    ],
    care: [
      "Wash dark colors separately",
      "Use cold water",
      "Do not dry clean",
      "Hang dry for best print life"
    ]
  },
  {
    id: "item-004",
    slug: "peace-collection",
    name: "The Peace Collection",
    type: "T-Shirt",
    price: 14000,
    image: "product-04-peace-gray-hanger.jpg",
    gallery: [
      "product-04-peace-gray-hanger.jpg",
      "product-05-peace-white-model.jpg",
      "product-06-peace-black-model.jpg",
      "product-07-peace-brown-front-back.jpg",
      "photo_2026-05-28_22-17-15.jpg"
    ],
    alt: "Gray Dreyluxe Peace collection He fights for me t-shirt",
    description: "No matter how hard life may be, be still and know that God will fight for you.",
    story: "A calm but confident collection made for moments when faith has to be worn out loud.",
    colors: ["White", "Black", "Brown"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    fit: "Relaxed unisex fit",
    availability: "Ready to order",
    features: [
      "Available in multiple earthy colorways",
      "Faith statement with a restful tone",
      "Soft feel for all-day comfort",
      "Clean enough for casual or styled looks"
    ],
    care: [
      "Wash similar colors together",
      "Turn garment inside out",
      "Avoid bleach and harsh detergents",
      "Air dry to preserve shape"
    ]
  }
];

export function getProductById(productId) {
  if (!productId) {
    return null;
  }

  return inventory.find((product) => product.id === productId || product.slug === productId) || null;
}

export function getRelatedProducts(productId, limit = 3) {
  const activeProduct = getProductById(productId);
  return inventory
    .filter((product) => product.id !== activeProduct?.id)
    .slice(0, limit);
}
