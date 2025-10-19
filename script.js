// Firebase configuration - replace with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyC9HigH5SDetbx_NMFtJCjW3HoDo3Xootg",
  authDomain: "farm-products-store.firebaseapp.com",
  projectId: "farm-products-store",
  storageBucket: "farm-products-store.firebasestorage.app",
  messagingSenderId: "880498107639",
  appId: "1:880498107639:web:79b20160518c28c93e9ff2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Helper to show toast messages
function showToast(message, type='success') {
  const toast = document.getElementById('toast');
  toast.className = 'toast show ' + type;
  toast.innerText = message;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Show loading spinner initially
function showLoading() {
  document.getElementById('loading-spinner').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('loading-spinner').style.display = 'none';
}

// Load products from Firestore
async function loadProducts() {
  showLoading();
  try {
    const snapshot = await db.collection('products').where('status', '==', 'active').get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Failed to load products', 'error');
    // Show friendly error message
    document.getElementById('bestsellers-grid').innerHTML = `
      <p style="text-align:center;">Error loading products. Please check console.</p>`;
  } finally {
    hideLoading();
  }
}

// Display products in grid
function displayProducts(products) {
  const container = document.getElementById('products-grid');
  container.innerHTML = '';
  const categorySet = new Set();

  if (products.length === 0) {
    container.innerHTML = `
      <p style="text-align:center;">No products found. <button class="btn btn-primary" onclick="seedInitialProducts()">Add Sample Products</button></p>`;
    return;
  }

  products.forEach(prod => {
    if (prod.category) categorySet.add(prod.category);
    const starRating = generateStars(prod.rating || 0);
    container.innerHTML += `
      <div class="product-card" onclick="showProductDetails('${prod.id}')">
        <img src="${prod.image || 'https://via.placeholder.com/400x250?text=No+Image'}" alt="${prod.name}">
        <div class="product-info">
          <h3>${prod.name}</h3>
          <div class="category-badge">${prod.category}</div>
          <div class="price">
            <span class="original">₹${prod.price}</span>
            ${prod.discountedPrice ? `<span class="discounted">₹${prod.discountedPrice}</span>` : ''}
          </div>
          <div class="rating">${starRating}</div>
          <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart('${prod.id}', 1)">Add to Cart</button>
        </div>
      </div>`;
  });

  // Populate category filter options
  const categoryFilter = document.getElementById('category-filter');
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  Array.from(categorySet).sort().forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
  document.getElementById('products-count').innerText = `${products.length} products found`;
}

// Generate star ratings
function generateStars(rating=0) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
  let starsHTML = '';
  for (let i=0; i<fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
  if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
  const emptyStars = 5 - fullStars - halfStar;
  for (let i=0; i<emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';
  return starsHTML;
}

// Show product details modal
async function showProductDetails(productId) {
  try {
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) return;
    const product = { id: doc.id, ...doc.data() };
    document.getElementById('product-modal-body').innerHTML = `
      <h2>${product.name}</h2>
      <img src="${product.image || 'https://via.placeholder.com/400x250?text=No+Image'}" alt="${product.name}">
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Price:</strong> ₹${product.price}</p>
      ${product.discountedPrice ? `<p><strong>Discounted Price:</strong> ₹${product.discountedPrice}</p>` : ''}
      <p><strong>Description:</strong> ${product.description || 'N/A'}</p>
      <p><strong>Features:</strong> ${(product.features || []).join(', ')}</p>
      <p><strong>Rating:</strong> ${generateStars(product.rating || 0)}</p>
    `;
    openModal('product-modal');
  } catch (error) {
    console.error('Error fetching product details:', error);
    showToast('Failed to fetch product details', 'error');
  }
}

// Open modal
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

// Close modal
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Seed sample products into Firestore
async function seedInitialProducts() {
  if (!confirm('Are you sure you want to add sample products?')) return;
  try {
    const sampleProducts = [
      {
        name: "Organic Whole Wheat Flour",
        category: "Flour/Atta & Suji",
        price: 320,
        discountedPrice: 280,
        unit: "5kg",
        rating: 4.5,
        description: "Fresh chakki atta, soft and makes chapatis that stay fluffy and tasty for long.",
        features: ["High Fiber", "Zero Additives", "Stone Ground"],
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
        stock: 50,
        status: "active"
      },
      {
        name: "Traditional Basmati Rice",
        category: "Rice & Rice Products",
        price: 650,
        discountedPrice: 580,
        unit: "5kg",
        rating: 4.7,
        description: "Aged basmati rice with extra long grains.",
        features: ["Aged Rice", "Extra Long Grain", "Aromatic"],
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
        stock: 45,
        status: "active"
      },
      {
        name: "A2 Cow Ghee",
        category: "Oils & Ghee",
        price: 650,
        discountedPrice: 599,
        unit: "500ml",
        rating: 4.6,
        description: "Pure A2 cow ghee made using traditional bilona method.",
        features: ["A2 Milk", "Bilona Method", "Pure & Natural"],
        image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
        stock: 40,
        status: "active"
      },
      {
        name: "Organic Turmeric Powder",
        category: "Spices & Masalas",
        price: 120,
        discountedPrice: 110,
        unit: "200g",
        rating: 4.5,
        description: "Pure organic turmeric powder, bright yellow and aromatic.",
        features: ["Organic", "No Pesticides"],
        image: "https://images.unsplash.com/photo-1605615617497-0840950f038a?w=400",
        stock: 100,
        status: "active"
      },
      {
        name: "Organic Almonds",
        category: "Dry Fruits & Nuts",
        price: 380,
        discountedPrice: 350,
        unit: "250g",
        rating: 4.8,
        description: "Crunchy, fresh almonds for healthy snacking.",
        features: ["Organic", "High Protein"],
        image: "https://images.unsplash.com/photo-1570809333005-11379670f9d9?w=400",
        stock: 60,
        status: "active"
      },
      {
        name: "Diwali Rasoi Essentials Pack",
        category: "Combo & Deals",
        price: 2903,
        discountedPrice: 2757,
        unit: "Combo",
        rating: 4.9,
        description: "Complete cooking essentials for festive season.",
        features: ["Combo Deal", "Organic"],
        image: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=400",
        stock: 20,
        status: "active"
      }
    ];
    for (const prod of sampleProducts) {
      await db.collection('products').add(prod);
    }
    showToast('✅ Sample products added!', 'success');
    // Reload products after seeding
    loadProducts();
  } catch (err) {
    console.error('Error seeding products:', err);
    showToast('Failed to seed products', 'error');
  }
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  // Search and filter controls
  document.getElementById('search-input').addEventListener('input', filterProducts);
  document.getElementById('category-filter').addEventListener('change', filterProducts);
  document.getElementById('sort-select').addEventListener('change', sortProducts);

  // Cart icon click
  document.querySelector('.cart-btn').addEventListener('click', showCart);
  
  // Toast hide on click
  document.getElementById('toast').addEventListener('click', () => {
    document.getElementById('toast').className = 'toast';
  });
  
  // Modal close handlers
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.closest('.modal').id);
    });
  });
});
