/**
 * RAG Knowledge Base and Search Engine for CraveCart
 * Contains curated documentation for FAQs, dietary guidelines, delivery policies, and refund rules.
 */

const KNOWLEDGE_DOCS = [
  {
    id: "delivery_policy",
    category: "policy",
    title: "Delivery Policy and Estimated Times",
    keywords: ["delivery", "time", "fee", "charge", "speed", "late", "eta", "tracking"],
    content: "Standard food delivery is completed within 30-45 minutes. A flat delivery charge of ₹60 applies to standard orders. Live GPS tracking is available from the moment the delivery partner picks up the order.",
  },
  {
    id: "refund_cancellation",
    category: "policy",
    title: "Cancellation and Refund Rules",
    keywords: ["refund", "cancel", "money", "cancellation", "return"],
    content: "Orders can be cancelled before the restaurant begins preparation for a 100% instant refund. Once preparation starts, cancellation depends on restaurant acceptance. Online payment refunds reflect back to the source bank account or UPI within 2-4 business days.",
  },
  {
    id: "hygiene_packaging",
    category: "quality",
    title: "Food Safety and Tamper-Proof Packaging",
    keywords: ["hygiene", "safety", "clean", "package", "tamper", "seal"],
    content: "All partner restaurants adhere to strict food safety guidelines. Orders are sealed in tamper-evident packaging to ensure freshness and prevent cross-contamination.",
  },
  {
    id: "dietary_options",
    category: "food",
    title: "Vegetarian and Dietary Preferences",
    keywords: ["vegetarian", "veg", "vegan", "halal", "jain", "gluten", "diet"],
    content: "CraveCart clearly identifies 100% Pure Veg restaurants with green indicators. Customers can filter menus for vegetarian dishes, spicy levels, or chef specialties.",
  },
  {
    id: "payment_options",
    category: "payment",
    title: "Accepted Payment Methods",
    keywords: ["payment", "pay", "card", "upi", "cod", "cash", "razorpay"],
    content: "We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking securely powered by Razorpay.",
  },
];

function searchKnowledgeBase(query, limit = 2) {
  if (!query || typeof query !== "string") return [];
  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scoredDocs = KNOWLEDGE_DOCS.map((doc) => {
    let score = 0;
    const docText = `${doc.title} ${doc.keywords.join(" ")} ${doc.content}`.toLowerCase();

    for (const token of queryTokens) {
      if (doc.keywords.includes(token)) score += 5;
      if (docText.includes(token)) score += 2;
    }
    return { doc, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.doc);

  return scoredDocs;
}

module.exports = {
  searchKnowledgeBase,
  KNOWLEDGE_DOCS,
};
