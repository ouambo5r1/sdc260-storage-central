/*
    Assignment: 4.6 Performance Assessment: Storage Central
    Author: Rodrigue Sifor OUAMBO V MBOLIYOU (OU26049981)
    Date: November 24, 2026
    Purpose: Product data, cart logic, and stock management for Willow & Pine
             Crafts. Uses three kinds of browser storage:
               - localStorage   : cart contents and product stock (craftCart, craftStock)
               - sessionStorage : items added during this browsing session (itemsAddedThisSession)
               - cookie         : products in the last purchase (lastPurchased)
*/

/* =========================================
     PRODUCT DATA
========================================= */

// Six handmade products (starting stock is the stock before anything is in a cart)
const defaultProducts = [
    {
        id: 1,
        name: "Hand-Poured Soy Candle",
        description: "Small-batch soy wax candle with a cedar and vanilla scent.",
        price: 18.00,
        stock: 5,
        image: "images/candle.png",
        alt: "Soy candle in a glass jar with a lit wick"
    },
    {
        id: 2,
        name: "Wheel-Thrown Coffee Mug",
        description: "Stoneware mug thrown on the wheel and glazed by hand.",
        price: 26.00,
        stock: 4,
        image: "images/mug.png",
        alt: "Handmade ceramic coffee mug"
    },
    {
        id: 3,
        name: "Knitted Wool Scarf",
        description: "Soft merino wool scarf knitted in a ribbed pattern.",
        price: 42.00,
        stock: 3,
        image: "images/scarf.png",
        alt: "Folded hand-knitted wool scarf"
    },
    {
        id: 4,
        name: "Macrame Wall Hanging",
        description: "Cotton cord wall hanging knotted on a driftwood dowel.",
        price: 55.00,
        stock: 2,
        image: "images/macrame.png",
        alt: "Macrame wall hanging made from natural cotton cord"
    },
    {
        id: 5,
        name: "Wooden Coaster Set",
        description: "Set of four coasters cut from reclaimed walnut and oak.",
        price: 22.00,
        stock: 6,
        image: "images/coasters.png",
        alt: "Set of round wooden coasters"
    },
    {
        id: 6,
        name: "Leather Bookmark",
        description: "Hand-stitched leather bookmark with a stamped pine tree.",
        price: 9.50,
        stock: 1,
        image: "images/bookmark.png",
        alt: "Brown leather bookmark with a tassel"
    }
];

/* =========================================
     LOAD SAVED DATA FROM BROWSER STORAGE
========================================= */

// localStorage: cart array of { id, quantity }
let cart = JSON.parse(localStorage.getItem("craftCart")) || [];

// localStorage: current stock for each product id, e.g. { "1": 5, "2": 4 }
let stock = JSON.parse(localStorage.getItem("craftStock")) || {};

// Fill in any product that does not have a saved stock value yet
defaultProducts.forEach(product => {
    if (stock[product.id] === undefined) {
        stock[product.id] = product.stock;
    }
});

// sessionStorage: how many items were added during this browsing session
let sessionAdds = Number(sessionStorage.getItem("itemsAddedThisSession")) || 0;

/* =========================================
     DOM REFERENCES
========================================= */

const productGrid = document.getElementById("product-grid");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const headerCount = document.getElementById("header-count");
const cartPanel = document.getElementById("cart");
const checkoutBtn = document.getElementById("checkout-btn");
const clearBtn = document.getElementById("clear-btn");
const sessionCount = document.getElementById("session-count");
const lastPurchased = document.getElementById("last-purchased");
const welcomeMessage = document.getElementById("welcome-message");
const notification = document.getElementById("notification");

/* =========================================
     OUT OF STOCK TOOLTIP (follows the cursor)
========================================= */

const tooltip = document.createElement("div");
tooltip.classList.add("mouse-tooltip");
tooltip.textContent = "Out of Stock";
document.body.appendChild(tooltip);

/* =========================================
     HELPER FUNCTIONS
========================================= */

// Find a product object by id
function getProduct(id) {
    return defaultProducts.find(product => product.id === id);
}

// Save the cart and stock to localStorage
function saveLocalData() {
    localStorage.setItem("craftCart", JSON.stringify(cart));
    localStorage.setItem("craftStock", JSON.stringify(stock));
}

// Read one cookie value by name (returns null if missing)
function getCookie(name) {
    const parts = document.cookie.split(";");
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith(name + "=")) {
            return decodeURIComponent(trimmed.substring(name.length + 1));
        }
    }
    return null;
}

// Save a cookie that lasts for 30 days
function setCookie(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

/* =========================================
     DISPLAY PRODUCTS
========================================= */

function displayProducts() {
    productGrid.innerHTML = "";

    defaultProducts.forEach(product => {
        const available = stock[product.id];
        const card = document.createElement("article");
        card.classList.add("product-card");

        // Grey out the card when the product is out of stock
        if (available === 0) {
            card.classList.add("out-of-stock");

            // Show the "Out of Stock" tooltip next to the cursor
            card.addEventListener("mousemove", event => {
                tooltip.style.left = `${event.clientX + 14}px`;
                tooltip.style.top = `${event.clientY + 14}px`;
                tooltip.classList.add("show");
            });

            card.addEventListener("mouseleave", () => {
                tooltip.classList.remove("show");
            });
        }

        card.innerHTML = `
            <img src="${product.image}" alt="${product.alt}">
            <section class="product-content">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">$${product.price.toFixed(2)}</p>
                <p class="stock">Available: ${available}</p>
                <button type="button" class="add-btn" data-id="${product.id}"
                    ${available === 0 ? "disabled" : ""}
                    aria-label="Add ${product.name} to cart">
                    ${available === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
            </section>
        `;

        productGrid.appendChild(card);
    });
}

/* =========================================
     DISPLAY CART
========================================= */

function displayCart() {
    cartItems.innerHTML = "";

    let totalItems = 0;
    let totalCost = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    }

    cart.forEach(item => {
        const product = getProduct(item.id);
        const lineTotal = product.price * item.quantity;

        totalItems += item.quantity;
        totalCost += lineTotal;

        const row = document.createElement("article");
        row.classList.add("cart-item");
        row.innerHTML = `
            <h3>${product.name}</h3>
            <p>$${product.price.toFixed(2)} each &bull; Line total: $${lineTotal.toFixed(2)}</p>
            <section class="qty-controls">
                <button type="button" class="qty-btn decrease-btn" data-id="${product.id}"
                    aria-label="Decrease ${product.name} quantity">-</button>
                <span aria-label="Quantity">${item.quantity}</span>
                <button type="button" class="qty-btn increase-btn" data-id="${product.id}"
                    aria-label="Increase ${product.name} quantity"
                    ${stock[product.id] === 0 ? "disabled" : ""}>+</button>
                <button type="button" class="remove-btn" data-id="${product.id}"
                    aria-label="Remove ${product.name} from cart">Remove</button>
            </section>
        `;
        cartItems.appendChild(row);
    });

    cartCount.textContent = totalItems;
    headerCount.textContent = totalItems;
    cartTotal.textContent = `$${totalCost.toFixed(2)}`;
}

/* =========================================
     STORAGE READOUTS (session + cookie)
========================================= */

function displayStorageInfo() {
    // sessionStorage readout
    sessionCount.textContent = sessionAdds;

    // Cookie readout
    const last = getCookie("lastPurchased");
    if (last) {
        lastPurchased.textContent = JSON.parse(last).join(", ");
        welcomeMessage.textContent = `Welcome back! Last time you took home: ${JSON.parse(last).join(", ")}.`;
    } else {
        lastPurchased.textContent = "No purchases yet";
        welcomeMessage.textContent = "Candles, pottery, knitwear, and woodwork made by hand in small batches.";
    }
}

/* =========================================
     CART ACTIONS
========================================= */

// Add one of a product to the cart
function addToCart(id) {
    if (stock[id] <= 0) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id: id, quantity: 1 });
    }

    // Reduce available stock
    stock[id]--;

    // sessionStorage: count every add during this session (not reduced on removal)
    sessionAdds++;
    sessionStorage.setItem("itemsAddedThisSession", sessionAdds);

    saveLocalData();
    refreshPage();
    showAddedFeedback(getProduct(id).name);
}

// Change the quantity of an item already in the cart (+1 or -1)
function changeQuantity(id, change) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;

    if (change > 0) {
        // Increasing works like adding another one
        addToCart(id);
        return;
    }

    // Decreasing puts one back in stock
    item.quantity--;
    stock[id]++;

    if (item.quantity <= 0) {
        cart = cart.filter(entry => entry.id !== id);
    }

    saveLocalData();
    refreshPage();
}

// Remove a product from the cart completely
function removeFromCart(id) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;

    // Return every unit to stock
    stock[id] += item.quantity;
    cart = cart.filter(entry => entry.id !== id);

    saveLocalData();
    refreshPage();
}

// Empty the whole cart and restore stock
function clearCart() {
    cart.forEach(item => {
        stock[item.id] += item.quantity;
    });
    cart = [];

    saveLocalData();
    refreshPage();
}

// Checkout: alert the totals, save the last purchase in a cookie, clear the cart
function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty. Add a craft before checking out.");
        return;
    }

    let totalItems = 0;
    let totalCost = 0;
    const names = [];

    cart.forEach(item => {
        const product = getProduct(item.id);
        totalItems += item.quantity;
        totalCost += product.price * item.quantity;
        names.push(`${product.name} x${item.quantity}`);
    });

    alert(`Thank you for your order!\n\nItems purchased: ${totalItems}\nTotal cost: $${totalCost.toFixed(2)}`);

    // Cookie: remember what was just purchased
    setCookie("lastPurchased", JSON.stringify(names));

    // The items are sold, so the stock stays reduced; only the cart is emptied
    cart = [];
    saveLocalData();
    refreshPage();
}

/* =========================================
     VISUAL FEEDBACK
     When an item is added I use three cues together:
       1. A toast notification slides up with the product name.
       2. The cart panel gets the "cart-bump" class, which plays a short
          bounce animation and a gold highlight (see the CSS).
       3. The header cart counter briefly changes color.
========================================= */

function showAddedFeedback(productName) {
    notification.textContent = `${productName} added to cart!`;
    notification.classList.add("show");

    cartPanel.classList.add("cart-bump");
    headerCount.parentElement.classList.add("flash");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 1800);

    setTimeout(() => {
        cartPanel.classList.remove("cart-bump");
        headerCount.parentElement.classList.remove("flash");
    }, 700);
}

/* =========================================
     EVENT HANDLING (one listener for every button)
========================================= */

document.addEventListener("click", event => {
    const target = event.target;
    const id = Number(target.dataset.id);

    if (target.classList.contains("add-btn")) {
        addToCart(id);
    } else if (target.classList.contains("increase-btn")) {
        changeQuantity(id, 1);
    } else if (target.classList.contains("decrease-btn")) {
        changeQuantity(id, -1);
    } else if (target.classList.contains("remove-btn")) {
        removeFromCart(id);
    }
});

checkoutBtn.addEventListener("click", checkout);
clearBtn.addEventListener("click", clearCart);

/* =========================================
     INITIALIZE
========================================= */

function refreshPage() {
    tooltip.classList.remove("show");
    displayProducts();
    displayCart();
    displayStorageInfo();
}

refreshPage();
