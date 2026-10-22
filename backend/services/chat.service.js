const menuModel = require("../Models/Menuitems");
const restModel = require("../Models/RestaurantSchema");
const orderModel = require("../Models/OrderSchema");
const couponModel = require("../Models/CouponSchema");
const { searchKnowledgeBase } = require("./rag.service");

/**
 * Handle conversational user query with authenticated live MongoDB data and RAG retrieval
 */
async function processUserMessage(query, authenticatedUser) {
  const normalizedQuery = (query || "").trim().toLowerCase();
  const userId = authenticatedUser?.id || authenticatedUser?._id;

  // 1. Live Order Status Intent
  if (
    normalizedQuery.includes("order") ||
    normalizedQuery.includes("status") ||
    normalizedQuery.includes("where is") ||
    normalizedQuery.includes("track")
  ) {
    if (!userId) {
      return {
        reply: "To check your order status, please log in with your CraveCart account so I can look up your active deliveries securely.",
        intent: "auth_required",
        suggestions: ["Log In to account", "Explore Menu", "View active offers"],
      };
    }

    try {
      const latestOrder = await orderModel
        .findOne({ userid: userId })
        .populate("menuid")
        .populate("deliverypersonid")
        .sort({ createdAt: -1 });

      if (!latestOrder) {
        return {
          reply: "You don't have any recent orders placed on CraveCart. Would you like to browse restaurants or see popular foods?",
          intent: "order_status",
          suggestions: ["View Restaurants", "Browse popular dishes", "View active coupons"],
        };
      }

      const itemName = latestOrder.menuid?.name || (latestOrder.items && latestOrder.items[0]?.name) || "Food Order";
      const status = latestOrder.status;
      const deliveryGuy = latestOrder.deliverypersonid?.name ? ` Your delivery partner is **${latestOrder.deliverypersonid.name}**.` : "";
      const eta = latestOrder.estimatedDeliveryMinutes ? ` Estimated arrival time: **${latestOrder.estimatedDeliveryMinutes} mins**.` : "";

      return {
        reply: `Your latest order for **${itemName}** (Order #${latestOrder._id.toString().slice(-6).toUpperCase()}) is currently **${status}**!${deliveryGuy}${eta}\n\nDelivery address: *${latestOrder.address}*.`,
        intent: "order_status",
        data: {
          orderId: latestOrder._id,
          status: latestOrder.status,
          etaMinutes: latestOrder.estimatedDeliveryMinutes,
        },
        suggestions: ["Track live on map", "Order details", "Contact support"],
      };
    } catch (err) {
      return {
        reply: "I encountered an issue retrieving your live order status. Please check your Orders page directly.",
        intent: "error",
      };
    }
  }

  // 2. Coupon & Offers Intent
  if (
    normalizedQuery.includes("offer") ||
    normalizedQuery.includes("coupon") ||
    normalizedQuery.includes("discount") ||
    normalizedQuery.includes("promo")
  ) {
    try {
      const activeCoupons = await couponModel.find({ isActive: true }).limit(4);

      if (activeCoupons.length > 0) {
        const couponsText = activeCoupons
          .map(
            (c) =>
              `• **${c.code}**: ${c.title} — ${
                c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`
              } on orders above ₹${c.minOrderAmount}`
          )
          .join("\n");

        return {
          reply: `Here are the currently active discounts on CraveCart:\n\n${couponsText}\n\nYou can apply any of these promo codes during checkout!`,
          intent: "active_coupons",
          data: activeCoupons,
          suggestions: ["Order now with discount", "Check vegetarian meals", "View biryani places"],
        };
      }
    } catch (e) {
      // Fallback below
    }
    return {
      reply: "Use code **WELCOME50** to get 50% off (up to ₹150) on your first food order above ₹199!",
      intent: "active_coupons",
      suggestions: ["View Menu", "Show Restaurants"],
    };
  }

  // 3. Biryani / Specific Food or Vegetarian Intent
  if (
    normalizedQuery.includes("biryani") ||
    normalizedQuery.includes("burger") ||
    normalizedQuery.includes("pizza") ||
    normalizedQuery.includes("veg") ||
    normalizedQuery.includes("meal") ||
    normalizedQuery.includes("food") ||
    normalizedQuery.includes("budget") ||
    normalizedQuery.includes("under")
  ) {
    try {
      const filter = {};
      if (normalizedQuery.includes("veg")) {
        filter.isVeg = true;
      }
      if (normalizedQuery.includes("biryani")) {
        filter.name = { $regex: "biryani", $options: "i" };
      } else if (normalizedQuery.includes("burger")) {
        filter.name = { $regex: "burger", $options: "i" };
      } else if (normalizedQuery.includes("pizza")) {
        filter.name = { $regex: "pizza", $options: "i" };
      }

      const dishes = await menuModel.find(filter).populate("restaurantid").limit(4);

      if (dishes.length > 0) {
        const dishList = dishes
          .map(
            (d) =>
              `• **${d.name}** — ₹${d.price} from *${d.restaurantid?.name || "Popular Partner"}* (Rating: ★ ${d.rating || 4.2})`
          )
          .join("\n");

        return {
          reply: `Here are some delicious options available right now:\n\n${dishList}`,
          intent: "menu_search",
          data: dishes,
          suggestions: ["Add to Cart", "View Full Menu", "Check active coupons"],
        };
      }
    } catch (err) {
      // Fallback
    }
  }

  // 4. Restaurant Availability & Opening Hours Intent
  if (
    normalizedQuery.includes("open") ||
    normalizedQuery.includes("accepting") ||
    normalizedQuery.includes("restaurant")
  ) {
    try {
      const openRestaurants = await restModel.find({ isactive: true }).limit(5);

      if (openRestaurants.length > 0) {
        const restList = openRestaurants
          .map((r) => `• **${r.name}** — ${r.cuisine || "Multi-Cuisine"} (★ ${r.rating || 4.3})`)
          .join("\n");

        return {
          reply: `These restaurants are currently open and accepting orders:\n\n${restList}`,
          intent: "restaurant_list",
          data: openRestaurants,
          suggestions: ["Browse Restaurants", "Check vegetarian options", "See offers"],
        };
      }
    } catch (err) {
      // Fallback
    }
  }

  // 5. RAG Policy & FAQ Knowledge Retrieval
  const ragDocs = searchKnowledgeBase(normalizedQuery, 2);
  if (ragDocs.length > 0) {
    const docSummary = ragDocs.map((d) => `**${d.title}**:\n${d.content}`).join("\n\n");
    return {
      reply: `Here is information regarding your query:\n\n${docSummary}`,
      intent: "rag_knowledge",
      suggestions: ["Check my order", "Browse popular dishes", "View active offers"],
    };
  }

  // 6. Helpful General Greeting / Fallback
  return {
    reply: "Hello! I am your **CraveCart Assistant**. I can help you find dishes, recommend vegetarian meals, check restaurant hours, give you active coupon codes, and track your live order delivery.\n\nHow can I help you today?",
    intent: "general",
    suggestions: [
      "Where is my order?",
      "Show active coupons",
      "Which restaurants are open?",
      "Find delicious biryani",
    ],
  };
}

module.exports = {
  processUserMessage,
};
