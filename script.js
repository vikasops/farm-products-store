// ====================================
// DESISUDDHA WEBSITE - JAVASCRIPT
// All Buttons Fixed + Indian Products
// ====================================

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9HigH5SDetbx_NMFtJCjW3HoDo3Xootg",
  authDomain: "farm-products-store.firebaseapp.com",
  projectId: "farm-products-store",
  storageBucket: "farm-products-store.firebasestorage.app",
  messagingSenderId: "880498107639",
  appId: "1:880498107639:web:79b20160518c28c93e9ff2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

console.log('✅ DesiSuddha Firebase initialized');

// State Management
const state = {
    products: [],
    cart: [],
    currentUser: null,
    categories: [
        { id: 'cat1', name: 'Wheat & Atta', slug: 'wheat-atta' },
        { id: 'cat2', name: 'Rice & Grains', slug: 'rice-grains' },
        { id: 'cat3', name: 'Dal & Pulses', slug: 'dal-pulses' },
        { id: 'cat4', name: 'Spices & Masala', slug: 'spices-masala' },
        { id: 'cat5', name: 'Oils & Ghee', slug: 'oils-ghee' },
        { id: 'cat6', name: 'Dry Fruits', slug: 'dry-fruits' },
        { id: 'cat7', name: 'Sugar & Jaggery', slug: 'sugar-jaggery' }
    ],
    filters: { category: '', sort: 'featured', search: '' },
    reviews: [
        { name: 'Rajesh Kumar', product: 'Desi Gehun Atta', rating: 5, review: 'Best quality wheat flour! Perfect for making soft rotis.' },
        { name: 'Priya Sharma', product: 'Arhar Dal', rating: 5, review: 'Pure and fresh dal, cooks quickly and tastes great.' },
        { name: 'Amit Singh', product: 'Haldi Powder', rating: 5, review: 'Authentic turmeric powder with natural color and aroma.' }
    ]
};

const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdummy/viewform';

// Firebase Functions
async function loadProducts() {
    try {
        showLoading();
        const snapshot = await db.collection('products').where('status', '==', 'active').get();
        state.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ Loaded ${state.products.length} products`);
        renderAllProducts();
        hideLoading();
    } catch (error) {
        console.error('❌ Error loading products:', error);
        hideLoading();
        const container = document.getElementById('bestsellers-grid');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 10px;">
                    <h3 style="color: #dc3545; margin-bottom: 20px;">⚠️ No Products Found</h3>
                    <p>Database is empty. Click below to add sample products!</p>
                    <button class="btn btn-primary" onclick="seedDesiProducts()" style="margin-top: 20px;">
                        <i class="fas fa-seedling"></i> Add DesiSuddha Products
                    </button>
                    <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

async function addProduct(productData) {
    try {
        showLoading();
        await db.collection('products').add({
            ...productData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Product added successfully!', 'success');
        await loadProducts();
        closeProductFormModal();
        hideLoading();
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Error: ' + error.message, 'error');
        hideLoading();
    }
}

async function updateProduct(productId, productData) {
    try {
        showLoading();
        await db.collection('products').doc(productId).update({
            ...productData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Product updated!', 'success');
        await loadProducts();
        closeProductFormModal();
        hideLoading();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        hideLoading();
    }
}

async function deleteProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || !confirm(`Delete "${product.name}"?`)) return;
    
    try {
        showLoading();
        await db.collection('products').doc(productId).delete();
        showToast('Product deleted!', 'success');
        await loadProducts();
        hideLoading();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        hideLoading();
    }
}

// Auth Functions
async function adminLogin(email, password) {
    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Login successful!', 'success');
        setTimeout(() => {
            hideLoading();
            navigateTo('admin-dashboard');
        }, 1000);
    } catch (error) {
        hideLoading();
        let msg = 'Login failed. ';
        if (error.code === 'auth/wrong-password') msg += 'Wrong password.';
        else if (error.code === 'auth/user-not-found') msg += 'User not found.';
        else msg += error.message;
        showToast(msg, 'error');
        document.getElementById('login-error').textContent = msg;
    }
}

async function adminLogout() {
    if (!confirm('Logout?')) return;
    try {
        await auth.signOut();
        showToast('Logged out', 'success');
        navigateTo('home');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

auth.onAuthStateChanged(user => {
    state.currentUser = user;
    const currentPage = window.location.hash.slice(1) || 'home';
    if (currentPage === 'admin-dashboard' && !user) {
        navigateTo('admin-login');
    }
});

// UI Rendering
function renderAllProducts() {
    renderBestsellers();
    renderProductsPage();
    renderCategories();
    renderReviews();
    renderAdminProducts();
    updateProductStats();
}

function renderBestsellers() {
    const container = document.getElementById('bestsellers-grid');
    if (!container) return;
    const bestsellers = state.products.filter(p => p.bestseller);
    if (bestsellers.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p>No products yet. Click below to add DesiSuddha products!</p>
                <button class="btn btn-primary" onclick="seedDesiProducts()" style="margin-top: 20px;">
                    <i class="fas fa-seedling"></i> Add Products
                </button>
            </div>
        `;
        return;
    }
    container.innerHTML = bestsellers.slice(0, 6).map(p => createProductCardHTML(p)).join('');
}

function renderProductsPage() {
    const container = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');
    if (!container) return;
    
    let filtered = [...state.products];
    
    if (state.filters.category) {
        filtered = filtered.filter(p => p.category === state.filters.category);
    }
    
    if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) ||
            p.category.toLowerCase().includes(search)
        );
    }
    
    switch (state.filters.sort) {
        case 'price-low':
            filtered.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
            break;
        case 'price-high':
            filtered.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
            break;
        case 'rating':
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    if (countEl) countEl.textContent = `Showing ${filtered.length} products`;
    if (filtered.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }
    container.innerHTML = filtered.map(p => createProductCardHTML(p)).join('');
}

function createProductCardHTML(product) {
    const stars = renderStars(product.rating || 4.5);
    return `
        <div class="product-card" onclick="showProductModal('${product.id}')">
            <img src="${product.image || 'https://via.placeholder.com/300x250?text=Product'}" alt="${product.name}">
            <div class="product-info">
                <span class="category-badge">${product.category}</span>
                <h3>${product.name}</h3>
                <div class="price">
                    ${product.discountedPrice ? `
                        <span class="original">₹${product.price}</span>
                        <span class="discounted">₹${product.discountedPrice}</span>
                    ` : `<span class="discounted">₹${product.price}</span>`}
                </div>
                <div class="rating">${stars}</div>
                <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
    if (half) stars += '<i class="fas fa-star-half-alt"></i>';
    const empty = 5 - Math.ceil(rating);
    for (let i = 0; i < empty; i++) stars += '<i class="far fa-star"></i>';
    return stars + ` <span>(${rating.toFixed(1)})</span>`;
}

function showProductModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('product-modal');
    const body = document.getElementById('product-modal-body');
    const features = Array.isArray(product.features) ? product.features.join('</li><li>') : '';
    
    body.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div>
                <img src="${product.image || 'https://via.placeholder.com/400'}" alt="${product.name}" style="width: 100%; border-radius: 10px;">
            </div>
            <div>
                <span class="category-badge">${product.category}</span>
                <h2>${product.name}</h2>
                <div class="price" style="margin: 20px 0;">
                    ${product.discountedPrice ? `
                        <span class="original" style="font-size: 1.2rem;">₹${product.price}</span>
                        <span class="discounted" style="font-size: 1.8rem;">₹${product.discountedPrice}</span>
                    ` : `<span class="discounted" style="font-size: 1.8rem;">₹${product.price}</span>`}
                    <span style="color: #666;">/${product.unit || 'unit'}</span>
                </div>
                <div class="rating">${renderStars(product.rating || 4.5)}</div>
                <p style="margin: 20px 0;">${product.description}</p>
                ${features ? `<div><h4>Features:</h4><ul style="list-style: disc; margin-left: 20px;"><li>${features}</li></ul></div>` : ''}
                <p><strong>Stock:</strong> ${product.stock || 0} units</p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="addToCart('${product.id}'); closeModal('product-modal');">
                        Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="proceedToOrder()">
                        Order Now
                    </button>
                </div>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function renderCategories() {
    const container = document.getElementById('categories-grid');
    const dropdown = document.getElementById('categories-dropdown');
    const filterSelect = document.getElementById('category-filter');
    const productCategorySelect = document.getElementById('product-category');
    
    if (container) {
        container.innerHTML = state.categories.map(cat => `
            <div class="category-card" onclick="filterByCategory('${cat.name}')">
                <h3>${cat.name}</h3>
            </div>
        `).join('');
    }
    
    if (dropdown) {
        dropdown.innerHTML = state.categories.map(cat => `
            <li><a href="#products" onclick="filterByCategory('${cat.name}')">${cat.name}</a></li>
        `).join('');
    }
    
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Categories</option>' +
            state.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
    }
    
    if (productCategorySelect) {
        productCategorySelect.innerHTML = state.categories.map(cat => 
            `<option value="${cat.name}">${cat.name}</option>`
        ).join('');
    }
}

function renderReviews() {
    const container = document.getElementById('reviews-carousel');
    if (!container) return;
    container.innerHTML = state.reviews.map(r => `
        <div class="review-card">
            <div class="rating">${renderStars(r.rating)}</div>
            <p>"${r.review}"</p>
            <div class="customer-name">${r.name}</div>
            <div style="color: #666;">${r.product}</div>
        </div>
    `).join('');
}

function filterByCategory(category) {
    state.filters.category = category;
    navigateTo('products');
    renderProductsPage();
    const filterSelect = document.getElementById('category-filter');
    if (filterSelect) filterSelect.value = category;
}

// Cart Functions
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) { showToast('Product not found', 'error'); return; }
    if (product.stock <= 0) { showToast('Out of stock', 'error'); return; }
    
    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    
    saveCartToLocalStorage();
    updateCartUI();
    showToast(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCartToLocalStorage();
    updateCartUI();
    renderCart();
}

function updateCartQuantity(productId, change) {
    const cartItem = state.cart.find(item => item.id === productId);
    if (!cartItem) return;
    
    cartItem.quantity += change;
    if (cartItem.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const product = state.products.find(p => p.id === productId);
    if (product && cartItem.quantity > product.stock) {
        cartItem.quantity = product.stock;
        showToast('Max stock reached', 'warning');
    }
    
    saveCartToLocalStorage();
    updateCartUI();
    renderCart();
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.textContent = totalItems;
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = '<p>Cart is empty!</p>';
        if (totalEl) totalEl.textContent = '0';
        return;
    }
    
    const total = state.cart.reduce((sum, item) => {
        const price = item.discountedPrice || item.price;
        return sum + (price * item.quantity);
    }, 0);
    
    container.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.discountedPrice || item.price} × ${item.quantity}</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateCartQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="btn btn-secondary" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

function proceedToOrder() {
    if (state.cart.length === 0) {
        showToast('Cart is empty!', 'error');
        return;
    }
    window.open(googleFormUrl, '_blank');
    showToast('Opening order form...', 'success');
}

function saveCartToLocalStorage() {
    localStorage.setItem('desisuddha-cart', JSON.stringify(state.cart));
}

function loadCartFromLocalStorage() {
    const saved = localStorage.getItem('desisuddha-cart');
    if (saved) {
        try {
            state.cart = JSON.parse(saved);
            updateCartUI();
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }
}

// Admin Functions
function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    
    if (state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products yet!</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.products.map(product => `
        <tr>
            <td><img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₹${product.discountedPrice || product.price}</td>
            <td>${product.stock || 0}</td>
            <td><span class="status-badge ${product.status}">${product.status}</span></td>
            <td>
                <button class="btn btn-primary" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-secondary" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateProductStats() {
    const totalEl = document.getElementById('total-products');
    if (totalEl) totalEl.textContent = state.products.length;
}

function openAddProductModal() {
    document.getElementById('product-form-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-form-modal').classList.add('active');
}

function editProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('product-form-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-discounted-price').value = product.discountedPrice || '';
    document.getElementById('product-unit').value = product.unit || '';
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-features').value = Array.isArray(product.features) ? product.features.join(', ') : '';
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-rating').value = product.rating || 4.5;
    document.getElementById('product-status').value = product.status || 'active';
    document.getElementById('product-bestseller').checked = product.bestseller || false;
    document.getElementById('product-combo').checked = product.combo || false;
    
    document.getElementById('product-form-modal').classList.add('active');
}

async function handleProductFormSubmit(event) {
    event.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value.trim(),
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        discountedPrice: parseFloat(document.getElementById('product-discounted-price').value) || null,
        unit: document.getElementById('product-unit').value.trim(),
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value.trim(),
        features: document.getElementById('product-features').value.split(',').map(f => f.trim()).filter(f => f),
        image: document.getElementById('product-image').value.trim(),
        rating: parseFloat(document.getElementById('product-rating').value) || 4.5,
        status: document.getElementById('product-status').value,
        bestseller: document.getElementById('product-bestseller').checked,
        combo: document.getElementById('product-combo').checked
    };
    
    if (!productData.name || !productData.category || !productData.price || !productData.unit) {
        showToast('Fill all required fields!', 'error');
        return;
    }
    
    if (productId) {
        await updateProduct(productId, productData);
    } else {
        await addProduct(productData);
    }
}

function closeProductFormModal() {
    document.getElementById('product-form-modal').classList.remove('active');
    document.getElementById('product-form').reset();
}

// Navigation
function navigateTo(page) {
    window.location.hash = page;
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(section => {
        section.classList.remove('active');
    });
    
    const pageElement = document.getElementById(page);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + page) {
            link.classList.add('active');
        }
    });
    
    if (page === 'products') {
        renderProductsPage();
    } else if (page === 'admin-dashboard') {
        if (!state.currentUser) {
            navigateTo('admin-login');
            return;
        }
        renderAdminProducts();
        updateProductStats();
    } else if (page === 'home') {
        renderAllProducts();
    }
    
    window.scrollTo(0, 0);
}

function navigateToProducts() {
    navigateTo('products');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Utility Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
}

// Seed DesiSuddha Products
async function seedDesiProducts() {
    try {
        showLoading();
        
        const desiProducts = [
            {
                name: "Premium Desi Gehun Atta (Whole Wheat Flour)",
                category: "Wheat & Atta",
                price: 280,
                discountedPrice: 250,
                unit: "5kg",
                rating: 4.8,
                description: "100% pure desi wheat flour, stone-ground to preserve nutrients. Perfect for making soft rotis and parathas.",
                features: ["Stone Ground", "100% Whole Wheat", "No Additives", "High Fiber"],
                image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
                stock: 100,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Organic Arhar Dal (Toor Dal)",
                category: "Dal & Pulses",
                price: 160,
                discountedPrice: 145,
                unit: "1kg",
                rating: 4.7,
                description: "Fresh toor dal rich in protein. Essential for making delicious dal tadka and sambar.",
                features: ["Protein Rich", "Quick Cooking", "No Polishing", "Natural"],
                image: "https://images.unsplash.com/photo-1596797882870-8c33deeaa9b2?w=400",
                stock: 80,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Pure Desi Haldi Powder (Turmeric)",
                category: "Spices & Masala",
                price: 110,
                discountedPrice: 99,
                unit: "200g",
                rating: 4.9,
                description: "Premium quality turmeric powder with natural color and medicinal properties. Perfect for Indian cooking.",
                features: ["Pure & Natural", "High Curcumin", "Aromatic", "Lab Tested"],
                image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
                stock: 150,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Traditional Basmati Rice",
                category: "Rice & Grains",
                price: 580,
                discountedPrice: 520,
                unit: "5kg",
                rating: 4.6,
                description: "Aged basmati rice with extra-long grains and aromatic fragrance. Perfect for biryani and pulao.",
                features: ["Aged Rice", "Extra Long Grain", "Aromatic", "Premium Quality"],
                image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
                stock: 60,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Pure Desi Ghee (A2 Cow Ghee)",
                category: "Oils & Ghee",
                price: 650,
                discountedPrice: 599,
                unit: "500ml",
                rating: 4.8,
                description: "Pure A2 cow ghee made using traditional bilona method. Rich aroma and authentic taste.",
                features: ["A2 Milk", "Bilona Method", "Pure & Natural", "Rich Aroma"],
                image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
                stock: 50,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Red Chilli Powder (Lal Mirch)",
                category: "Spices & Masala",
                price: 90,
                discountedPrice: 80,
                unit: "200g",
                rating: 4.7,
                description: "Pure red chilli powder with perfect spice level. Essential for Indian cooking.",
                features: ["Pure & Natural", "Perfect Spice", "No Additives", "Aromatic"],
                image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
                stock: 120,
                status: "active",
                bestseller: false,
                combo: false
            },
            {
                name: "Organic Moong Dal (Green Gram)",
                category: "Dal & Pulses",
                price: 140,
                discountedPrice: 125,
                unit: "1kg",
                rating: 4.6,
                description: "Fresh moong dal, protein-rich and easy to digest. Great for khichdi and dal.",
                features: ["Protein Rich", "Easy to Digest", "No Polishing", "Natural"],
                image: "https://images.unsplash.com/photo-1596797882870-8c33deeaa9b2?w=400",
                stock: 90,
                status: "active",
                bestseller: false,
                combo: false
            },
            {
                name: "Premium Dhaniya Powder (Coriander)",
                category: "Spices & Masala",
                price: 70,
                discountedPrice: 65,
                unit: "100g",
                rating: 4.5,
                description: "Pure coriander powder with natural aroma. Essential spice for Indian cuisine.",
                features: ["Pure & Fresh", "Aromatic", "No Additives", "Lab Tested"],
                image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
                stock: 100,
                status: "active",
                bestseller: false,
                combo: false
            }
        ];
        
        console.log(`🌱 Adding ${desiProducts.length} DesiSuddha products...`);
        
        for (const product of desiProducts) {
            await db.collection('products').add({
                ...product,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Added: ${product.name}`);
        }
        
        hideLoading();
        showToast(`${desiProducts.length} products added! Refreshing...`, 'success');
        setTimeout(() => loadProducts(), 1000);
        
    } catch (error) {
        console.error('Error seeding products:', error);
        hideLoading();
        showToast('Error: ' + error.message, 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DesiSuddha loaded');
    
    loadCartFromLocalStorage();
    loadProducts();
    renderCategories();
    
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.slice(1) || 'home';
        showPage(page);
    });
    
    const initialPage = window.location.hash.slice(1) || 'home';
    showPage(initialPage);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.filters.search = e.target.value;
                renderProductsPage();
            }, 300);
        });
    }
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            state.filters.category = e.target.value;
            renderProductsPage();
        });
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.filters.sort = e.target.value;
            renderProductsPage();
        });
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            adminLogin(email, password);
        });
    }
    
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }
    
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }
    
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            renderCart();
            document.getElementById('cart-modal').classList.add('active');
        });
    }
    
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('onclick')) return;
            e.preventDefault();
            const section = link.dataset.section;
            document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.getElementById('admin-' + section).classList.add('active');
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        }
    });
    
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Thank you for subscribing!', 'success');
            newsletterForm.reset();
        });
    }
    
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Message sent!', 'success');
            contactForm.reset();
        });
    }
    
    console.log('✅ DesiSuddha ready!');
    console.log('💡 To add products, click the button or run: seedDesiProducts()');
});

window.seedDesiProducts = seedDesiProducts;
