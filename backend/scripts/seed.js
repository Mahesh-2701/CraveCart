/**
 * CraveCart Production Database Seed & Migration Script
 * Populates MongoDB Atlas with production-ready dummy data across all roles:
 * - Admin, Restaurant Owners, Delivery Partners, Customers
 * - Restaurants with geo-coordinates, cuisine tags, and ratings
 * - Rich Menu Items with photography, categories, dietary flags, and prices
 * - Active Promotional Coupons
 * - Sample Active & Historical Orders with tracking timelines
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const User = require("../Models/UserSchema");
const Admin = require("../Models/Admin");
const Restaurant = require("../Models/RestaurantSchema");
const MenuItem = require("../Models/Menuitems");
const DeliveryPerson = require("../Models/Deliveryperson");
const Order = require("../Models/OrderSchema");
const Coupon = require("../Models/CouponSchema");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in backend/.env!");
  process.exit(1);
}

async function runSeed() {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log(" Connected to database:", mongoose.connection.name);

    // 1. Seed Coupons
    console.log("\n🏷️  Seeding Promotional Coupons...");
    const couponsData = [
      {
        code: "WELCOME50",
        title: "50% OFF on your first feast",
        description: "Get 50% discount up to ₹150 on your CraveCart orders above ₹149.",
        discountType: "percentage",
        discountValue: 50,
        maxDiscount: 150,
        minOrderAmount: 149,
        isActive: true,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        code: "CRAVE20",
        title: "20% OFF Everyday Cravings",
        description: "Enjoy 20% off up to ₹100 on orders above ₹199.",
        discountType: "percentage",
        discountValue: 20,
        maxDiscount: 100,
        minOrderAmount: 199,
        isActive: true,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        code: "FLAT100",
        title: "Flat ₹100 OFF Mega Meals",
        description: "Flat ₹100 discount on orders above ₹399.",
        discountType: "flat",
        discountValue: 100,
        maxDiscount: 100,
        minOrderAmount: 399,
        isActive: true,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        code: "FREESHIP",
        title: "Free Delivery on orders > ₹199",
        description: "Enjoy ₹40 off for free delivery on every order above ₹199.",
        discountType: "flat",
        discountValue: 40,
        maxDiscount: 40,
        minOrderAmount: 199,
        isActive: true,
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const c of couponsData) {
      await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
    }
    console.log(`✓ Seeded ${couponsData.length} promotional coupons.`);

    // 2. Seed Administrator Account
    console.log("\n👑 Seeding Administrator Account...");
    let admin = await Admin.findOne({ email: "admin@cravecart.com" });
    if (!admin) {
      admin = await Admin.create({
        name: "CraveCart Master Admin",
        email: "admin@cravecart.com",
        password: "AdminPassword@123",
        role: "admin",
      });
      console.log("✓ Created Admin: admin@cravecart.com / AdminPassword@123");
    } else {
      console.log("✓ Admin account already exists: admin@cravecart.com");
    }

    // 3. Seed Customers
    console.log("\n👤 Seeding Customer Accounts...");
    const customerData = [
      {
        name: "Mahesh Demo User",
        email: "customer@cravecart.com",
        password: "CustomerPassword@123",
        phonenumber: 9876543210,
        address: "Flat 402, Royal Palms, Koramangala 4th Block",
        city: "Bangalore",
        pincode: 560034,
        role: "user",
      },
      {
        name: "Harini Foodie",
        email: "harini@cravecart.com",
        password: "CustomerPassword@123",
        phonenumber: 9812345678,
        address: "Villa 12, Green Glen Layout, Bellandur",
        city: "Bangalore",
        pincode: 560103,
        role: "user",
      },
    ];

    const users = [];
    for (const u of customerData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
        console.log(`✓ Created User: ${u.email} / ${u.password}`);
      } else {
        console.log(`✓ User already exists: ${u.email}`);
      }
      users.push(user);
    }

    // 4. Seed Delivery Partners
    console.log("\n🚴 Seeding Delivery Partners...");
    const deliveryData = [
      {
        name: "Ramesh Rider",
        email: "delivery@cravecart.com",
        password: "DeliveryPassword@123",
        phonenumber: 9845012345,
        address: "Indiranagar, Bangalore",
        vehicleType: "Electric Bike",
        rating: 4.9,
        totalDeliveries: 342,
        isAvailable: true,
        currentLocation: {
          lat: 12.9716,
          lng: 77.5946,
        },
      },
      {
        name: "Suresh Express",
        email: "suresh.delivery@cravecart.com",
        password: "DeliveryPassword@123",
        phonenumber: 9845098765,
        address: "HSR Layout, Bangalore",
        vehicleType: "Scooter",
        rating: 4.8,
        totalDeliveries: 215,
        isAvailable: true,
        currentLocation: {
          lat: 12.9352,
          lng: 77.6245,
        },
      },
    ];

    const deliveryPartners = [];
    for (const d of deliveryData) {
      let dp = await DeliveryPerson.findOne({ email: d.email });
      if (!dp) {
        dp = await DeliveryPerson.create(d);
        console.log(`✓ Created Delivery Partner: ${d.email} / ${d.password}`);
      } else {
        console.log(`✓ Delivery Partner already exists: ${d.email}`);
      }
      deliveryPartners.push(dp);
    }

    // 5. Seed Curated Restaurants
    console.log("\n🍽️  Seeding Curated Restaurants...");
    const restaurantsData = [
      {
        name: "Paradise Biryani & Kebabs",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
        email: "paradise@cravecart.com",
        password: "RestaurantPassword@123",
        phonenumber: 9880011223,
        address: "100 Feet Road, Indiranagar",
        city: "Bangalore",
        pincode: 560038,
        isactive: true,
        cuisine: "Biryani, Mughlai, Kebabs, North Indian",
        rating: 4.6,
        ratingCount: 384,
        deliveryTimeMinutes: 25,
        costForTwo: 450,
        openingHours: "11:00 AM - 11:30 PM",
        featured: true,
        coordinates: { lat: 12.9784, lng: 77.6408 },
      },
      {
        name: "Green Leaf Pure Veg",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80",
        email: "greenleaf@cravecart.com",
        password: "RestaurantPassword@123",
        phonenumber: 9880022334,
        address: "80 Feet Road, Koramangala 4th Block",
        city: "Bangalore",
        pincode: 560034,
        isactive: true,
        cuisine: "South Indian, North Indian, Pure Veg, Thalis",
        rating: 4.5,
        ratingCount: 512,
        deliveryTimeMinutes: 20,
        costForTwo: 250,
        openingHours: "07:30 AM - 10:30 PM",
        featured: true,
        coordinates: { lat: 12.9345, lng: 77.6256 },
      },
      {
        name: "The Pizza Artisan & Pasta",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
        email: "pizzaartisan@cravecart.com",
        password: "RestaurantPassword@123",
        phonenumber: 9880033445,
        address: "Church Street, Ashok Nagar",
        city: "Bangalore",
        pincode: 560001,
        isactive: true,
        cuisine: "Italian, Woodfired Pizza, Pasta, Desserts",
        rating: 4.7,
        ratingCount: 620,
        deliveryTimeMinutes: 30,
        costForTwo: 550,
        openingHours: "12:00 PM - 11:00 PM",
        featured: true,
        coordinates: { lat: 12.9749, lng: 77.6053 },
      },
      {
        name: "Wok & Roll Pan Asian",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
        email: "woknroll@cravecart.com",
        password: "RestaurantPassword@123",
        phonenumber: 9880044556,
        address: "CMH Road, Indiranagar",
        city: "Bangalore",
        pincode: 560038,
        isactive: true,
        cuisine: "Pan-Asian, Chinese, Dimsums, Bowls",
        rating: 4.4,
        ratingCount: 290,
        deliveryTimeMinutes: 28,
        costForTwo: 400,
        openingHours: "12:00 PM - 11:00 PM",
        featured: false,
        coordinates: { lat: 12.9780, lng: 77.6430 },
      },
      {
        name: "Royal Sweets & Chaat Corner",
        image: "https://images.unsplash.com/photo-1505253758473-96b3015f21c9?w=800&q=80",
        email: "royalsweets@cravecart.com",
        password: "RestaurantPassword@123",
        phonenumber: 9880055667,
        address: "Commercial Street, Tasker Town",
        city: "Bangalore",
        pincode: 560051,
        isactive: true,
        cuisine: "Chaat, Street Food, Mithai, Desserts",
        rating: 4.3,
        ratingCount: 180,
        deliveryTimeMinutes: 18,
        costForTwo: 180,
        openingHours: "10:00 AM - 10:00 PM",
        featured: false,
        coordinates: { lat: 12.9822, lng: 77.6083 },
      },
    ];

    const seededRestaurants = [];
    for (const r of restaurantsData) {
      let rest = await Restaurant.findOne({ email: r.email });
      if (!rest) {
        rest = await Restaurant.create(r);
        console.log(`✓ Created Restaurant: ${r.name} (${r.email} / ${r.password})`);
      } else {
        // Update details
        Object.assign(rest, r);
        await rest.save();
        console.log(`✓ Updated Restaurant: ${r.name}`);
      }
      seededRestaurants.push(rest);
    }

    // 6. Seed Delicious Menu Items for each restaurant
    console.log("\n🍕 Seeding Menu Items...");
    const menuItemsData = [
      // Paradise Biryani
      {
        restaurantEmail: "paradise@cravecart.com",
        items: [
          {
            name: "Hyderabadi Dum Chicken Biryani",
            image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
            description: "Authentic slow-cooked saffron basmati rice layered with tender marinated chicken, aromatic spices, served with Mirchi Ka Salan and Raita.",
            price: 280,
            category: "Biryani",
            cuisine: "Hyderabadi",
            isVeg: false,
            isAvailable: true,
            rating: 4.8,
            ratingCount: 310,
            preparationTimeMinutes: 25,
            ingredients: ["Basmati Rice", "Chicken", "Saffron", "Yogurt", "Ghee", "Fried Onions"],
          },
          {
            name: "Royal Paneer Tikka Biryani",
            image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80",
            description: "Char-grilled cottage cheese cubes simmered in spiced dum gravy and fragrant long-grain rice.",
            price: 240,
            category: "Biryani",
            cuisine: "North Indian",
            isVeg: true,
            isAvailable: true,
            rating: 4.5,
            ratingCount: 180,
            preparationTimeMinutes: 20,
            ingredients: ["Paneer", "Basmati Rice", "Tandoori Spices", "Mint", "Raita"],
          },
          {
            name: "Murgh Malai Kebab (6 pcs)",
            image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80",
            description: "Creamy, melt-in-mouth chicken chunks marinated in cashew cream, green cardamom, and char-grilled in clay oven.",
            price: 320,
            category: "Starters",
            cuisine: "Mughlai",
            isVeg: false,
            isAvailable: true,
            rating: 4.7,
            ratingCount: 145,
            preparationTimeMinutes: 20,
            ingredients: ["Chicken Breast", "Cashew Paste", "Cream", "Cardamom", "Chutney"],
          },
          {
            name: "Butter Garlic Naan",
            image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
            description: "Leavened oven-baked flatbread brushed with fresh garlic and melted butter.",
            price: 60,
            category: "Breads",
            cuisine: "North Indian",
            isVeg: true,
            isAvailable: true,
            rating: 4.6,
            ratingCount: 220,
            preparationTimeMinutes: 10,
            ingredients: ["Refined Flour", "Garlic", "Butter", "Coriander"],
          },
        ],
      },
      // Green Leaf Pure Veg
      {
        restaurantEmail: "greenleaf@cravecart.com",
        items: [
          {
            name: "Ghee Roast Masala Dosa",
            image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80",
            description: "Crispy golden crepe roasted in pure desi ghee, stuffed with spiced potato masala, served with 3 chutneys and hot sambar.",
            price: 120,
            category: "South Indian",
            cuisine: "South Indian",
            isVeg: true,
            isAvailable: true,
            rating: 4.8,
            ratingCount: 420,
            preparationTimeMinutes: 15,
            ingredients: ["Rice Batter", "Desi Ghee", "Potato Masala", "Coconut Chutney", "Sambar"],
          },
          {
            name: "Paneer Butter Masala",
            image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80",
            description: "Soft cottage cheese simmered in a velvety, rich tomato, cashew, and butter gravy with fragrant kasuri methi.",
            price: 230,
            category: "Curries",
            cuisine: "North Indian",
            isVeg: true,
            isAvailable: true,
            rating: 4.6,
            ratingCount: 290,
            preparationTimeMinutes: 20,
            ingredients: ["Fresh Paneer", "Tomato Puree", "Cashew Cream", "Butter", "Kasuri Methi"],
          },
          {
            name: "Medu Vada Combo (2 pcs)",
            image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80",
            description: "Crunchy on the outside, fluffy inside lentil doughnuts served with aromatic Udupi sambar and coconut chutney.",
            price: 90,
            category: "South Indian",
            cuisine: "South Indian",
            isVeg: true,
            isAvailable: true,
            rating: 4.5,
            ratingCount: 175,
            preparationTimeMinutes: 12,
            ingredients: ["Urad Dal", "Curry Leaves", "Ginger", "Pepper", "Coconut Chutney"],
          },
        ],
      },
      // The Pizza Artisan
      {
        restaurantEmail: "pizzaartisan@cravecart.com",
        items: [
          {
            name: "Classic Margherita Woodfired Pizza",
            image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80",
            description: "11-inch sourdough crust with San Marzano tomato sauce, fresh mozzarella Fior di Latte, fresh basil, and extra virgin olive oil.",
            price: 340,
            category: "Pizza",
            cuisine: "Italian",
            isVeg: true,
            isAvailable: true,
            rating: 4.9,
            ratingCount: 390,
            preparationTimeMinutes: 25,
            ingredients: ["Sourdough", "San Marzano Sauce", "Mozzarella", "Fresh Basil", "EVOO"],
          },
          {
            name: "Smoked Chicken & Jalapeño Pizza",
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
            description: "Smoked barbecue chicken breast, spicy pickled jalapeños, red onions, and aged cheddar with mozzarella.",
            price: 440,
            category: "Pizza",
            cuisine: "Italian",
            isVeg: false,
            isAvailable: true,
            rating: 4.7,
            ratingCount: 260,
            preparationTimeMinutes: 25,
            ingredients: ["Smoked Chicken", "Jalapeños", "Mozzarella", "Cheddar", "Red Onion"],
          },
          {
            name: "Creamy Truffle Mushroom Fettuccine",
            image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281744?w=800&q=80",
            description: "Handmade fettuccine ribbons tossed in a black truffle butter sauce with wild button and portobello mushrooms.",
            price: 380,
            category: "Pasta",
            cuisine: "Italian",
            isVeg: true,
            isAvailable: true,
            rating: 4.8,
            ratingCount: 195,
            preparationTimeMinutes: 22,
            ingredients: ["Fettuccine", "Black Truffle Oil", "Wild Mushrooms", "Parmigiano Reggiano"],
          },
        ],
      },
      // Wok & Roll Pan Asian
      {
        restaurantEmail: "woknroll@cravecart.com",
        items: [
          {
            name: "Schezwan Chicken Hakka Noodles",
            image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
            description: "Wok-tossed noodles with shredded chicken, crunchy bell peppers, cabbage, and homemade spicy Schezwan sauce.",
            price: 240,
            category: "Asian",
            cuisine: "Pan-Asian",
            isVeg: false,
            isAvailable: true,
            rating: 4.6,
            ratingCount: 160,
            preparationTimeMinutes: 20,
            ingredients: ["Egg Noodles", "Chicken", "Schezwan Peppers", "Spring Onions", "Garlic"],
          },
          {
            name: "Crispy Chilli Baby Corn",
            image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80",
            description: "Batter-fried tender baby corn fingers tossed with spicy red chilies, scallions, and tangy dark soya sauce.",
            price: 190,
            category: "Starters",
            cuisine: "Chinese",
            isVeg: true,
            isAvailable: true,
            rating: 4.4,
            ratingCount: 130,
            preparationTimeMinutes: 18,
            ingredients: ["Baby Corn", "Green Chillies", "Garlic", "Dark Soy", "Spring Onions"],
          },
        ],
      },
      // Royal Sweets
      {
        restaurantEmail: "royalsweets@cravecart.com",
        items: [
          {
            name: "Dilli Special Raj Kachori",
            image: "https://images.unsplash.com/photo-1505253758473-96b3015f21c9?w=800&q=80",
            description: "King of chaats: giant crisp kachori filled with potatoes, sprouts, sweetened curd, tamarind & mint chutneys, garnished with sev and pomegranate.",
            price: 130,
            category: "Chaat",
            cuisine: "Street Food",
            isVeg: true,
            isAvailable: true,
            rating: 4.7,
            ratingCount: 240,
            preparationTimeMinutes: 10,
            ingredients: ["Kachori Shell", "Sprouts", "Sweet Dahi", "Imli Chutney", "Sev", "Pomegranate"],
          },
          {
            name: "Hot Gulab Jamun (2 Pcs)",
            image: "https://images.unsplash.com/photo-1589119908995-c6837fa14d48?w=800&q=80",
            description: "Deep-fried khoya dumplings soaked in fragrant rose water and green cardamom sugar syrup.",
            price: 80,
            category: "Desserts",
            cuisine: "Mithai",
            isVeg: true,
            isAvailable: true,
            rating: 4.9,
            ratingCount: 310,
            preparationTimeMinutes: 5,
            ingredients: ["Khoya", "Cardamom", "Rose Water", "Sugar Syrup", "Pistachio"],
          },
        ],
      },
    ];

    let totalMenuItems = 0;
    const allCreatedMenuItems = [];
    for (const group of menuItemsData) {
      const rest = seededRestaurants.find((r) => r.email === group.restaurantEmail);
      if (!rest) continue;

      for (const item of group.items) {
        const itemDoc = {
          ...item,
          restaurantid: rest._id,
        };
        const savedItem = await MenuItem.findOneAndUpdate(
          { name: item.name, restaurantid: rest._id },
          itemDoc,
          { upsert: true, new: true }
        );
        allCreatedMenuItems.push(savedItem);
        totalMenuItems++;
      }
    }
    console.log(`✓ Seeded ${totalMenuItems} delicious menu items across all restaurants.`);

    // 7. Seed Sample Orders with Live Tracking
    console.log("\n📦 Seeding Sample Customer Orders...");
    const sampleCustomer = users[0];
    const sampleRest = seededRestaurants[0]; // Paradise Biryani
    const sampleRider = deliveryPartners[0]; // Ramesh Rider
    const biryaniItem = allCreatedMenuItems.find((i) => i.name.includes("Chicken Biryani"));
    const naanItem = allCreatedMenuItems.find((i) => i.name.includes("Naan"));

    if (sampleCustomer && sampleRest && biryaniItem && sampleRider) {
      // Check if an order already exists for this user
      const existingOrder = await Order.findOne({ userid: sampleCustomer._id });
      if (!existingOrder) {
        // Order 1: Out for Delivery (Great for demonstrating live MapLibre 3D tracking immediately)
        const order1 = await Order.create({
          userid: sampleCustomer._id,
          menuid: biryaniItem._id,
          price: 340,
          quantity: 1,
          items: [
            {
              menuid: biryaniItem._id,
              name: biryaniItem.name,
              price: biryaniItem.price,
              quantity: 1,
              image: biryaniItem.image,
              restaurantid: sampleRest._id,
            },
            {
              menuid: naanItem._id,
              name: naanItem.name,
              price: naanItem.price,
              quantity: 1,
              image: naanItem.image,
              restaurantid: sampleRest._id,
            },
          ],
          subtotal: 340,
          deliveryFee: 40,
          discountAmount: 150,
          couponCode: "WELCOME50",
          totalAmount: 230,
          status: "Out for Delivery",
          paymentmethod: "Online",
          paymentStatus: "Paid",
          razorpayOrderId: "order_demo_seed_001",
          razorpayPaymentId: "pay_demo_seed_001",
          address: sampleCustomer.address,
          deliveryNotes: "Please leave at reception if not reachable",
          customerCoordinates: { lat: 12.9345, lng: 77.6256 },
          restaurantCoordinates: {
            lat: sampleRest.coordinates.lat,
            lng: sampleRest.coordinates.lng,
          },
          deliverypersonid: sampleRider._id,
          deliveryLocation: {
            lat: 12.9560,
            lng: 77.6320,
            updatedAt: new Date(),
          },
          isSimulated: true,
          statusHistory: [
            { status: "Pending", timestamp: new Date(Date.now() - 25 * 60 * 1000), comment: "Order placed by customer" },
            { status: "Preparing", timestamp: new Date(Date.now() - 20 * 60 * 1000), comment: "Accepted by Paradise Biryani" },
            { status: "Ready for Pickup", timestamp: new Date(Date.now() - 10 * 60 * 1000), comment: "Food packed & ready" },
            { status: "Out for Delivery", timestamp: new Date(Date.now() - 5 * 60 * 1000), comment: "Ramesh Rider picked up order" },
          ],
        });
        console.log(`✓ Created Active Order for Live Tracking demo: ID #${order1._id}`);

        // Order 2: Delivered (Historical Order)
        await Order.create({
          userid: sampleCustomer._id,
          menuid: biryaniItem._id,
          price: 280,
          quantity: 1,
          items: [
            {
              menuid: biryaniItem._id,
              name: biryaniItem.name,
              price: biryaniItem.price,
              quantity: 1,
              image: biryaniItem.image,
              restaurantid: sampleRest._id,
            },
          ],
          subtotal: 280,
          deliveryFee: 40,
          discountAmount: 0,
          totalAmount: 320,
          status: "Delivered",
          paymentmethod: "COD",
          paymentStatus: "Paid",
          address: sampleCustomer.address,
          customerCoordinates: { lat: 12.9345, lng: 77.6256 },
          restaurantCoordinates: {
            lat: sampleRest.coordinates.lat,
            lng: sampleRest.coordinates.lng,
          },
          deliverypersonid: sampleRider._id,
          statusHistory: [
            { status: "Pending", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { status: "Preparing", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000) },
            { status: "Delivered", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000) },
          ],
        });
        console.log("✓ Created Past Delivered Order for Order History demo.");
      } else {
        console.log("✓ Sample orders already exist.");
      }
    }

    console.log("\n=======================================================");
    console.log("🎉 CRAVECART DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=======================================================\n");
    console.log("You can now log in using these demo credentials:\n");
    console.log("👑 Platform Administrator:");
    console.log("   URL: http://localhost:3000/admin");
    console.log("   Email:    admin@cravecart.com");
    console.log("   Password: AdminPassword@123\n");

    console.log("🍽️  Restaurant Portal:");
    console.log("   URL: http://localhost:3000/restaurant/login");
    console.log("   Email:    paradise@cravecart.com");
    console.log("   Password: RestaurantPassword@123\n");

    console.log("🚴 Delivery Partner Portal:");
    console.log("   URL: http://localhost:3000/delivery/login");
    console.log("   Email:    delivery@cravecart.com");
    console.log("   Password: DeliveryPassword@123\n");

    console.log("👤 Customer Portal:");
    console.log("   URL: http://localhost:3000/login");
    console.log("   Email:    customer@cravecart.com");
    console.log("   Password: CustomerPassword@123\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed with error:", err);
    process.exit(1);
  }
}

runSeed();
