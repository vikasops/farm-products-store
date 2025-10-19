// ====================================
// FARM PRODUCTS WEBSITE - JAVASCRIPT
// Firebase Integrated Version
// ====================================

// ====================================
// FIREBASE CONFIGURATION
// ====================================
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

console.log('✅ Firebase initialized successfully');

// ====================================
// STATE MANAGEMENT
// ====================================
const state = {
    products: [],
    cart: [],
    currentUser: null,
    categories: [
        { id: 'cat1', name: 'Combos & Deals', slug: 'combos-deals' },
        { id: 'cat2', name: 'Flour/Atta & Suji', slug: 'flour-atta' },
        { id: 'cat3', name: 'Rice & Rice Products', slug: 'rice' },
        { id: 'cat4', name: 'Pulses & Dal', slug: 'pulses' },
        { id: 'cat5', name: 'Oils & Ghee', slug: 'oils-ghee' },
        { id: 'cat6', name: 'Dry Fruits & Nuts', slug: 'dry-fruits' },
        { id: 'cat7', name: 'Spices & Masalas', slug: 'spices' },
        { id: 'cat8', name: 'Salts & Sugar', slug: 'salts-sugar' },
        { id: 'cat9', name: 'Health Foods', slug: 'health-foods' },
        { id: 'cat10', name: 'Ready To Cook', slug: 'ready-to-cook' }
    ],
    filters: { category: '', sort: 'featured', search: '' },
    reviews: [
        { name: 'Neelam Sharma', product: 'Organic Whole Wheat Flour', rating: 5, review: 'Atta is fresh, soft, and makes chapatis that stay fluffy and tasty for long.' },
        { name: 'Jagdish', product: 'Organic Sonamasuri Raw Rice', rating: 5, review: 'Best quality rice, fresh and well packed.' },
        { name: 'Puneet Jain', product: 'Organic Ghee', rating: 5, review: 'Perfect taste, color, texture and aroma.' }
    ]
};

const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdummy/viewform';

// ====================================
// FIREBASE FUNCTIONS
// ====================================

async function loadProducts() {
    try {
        showLoading();
        console.log('🔄 Loading products from Firestore...');
        const snapshot = await db.collection('products').where('status', '==', 'active').get();
        state.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ Loaded ${state.products.length} products from Firestore`);
        renderAllProducts();
        hideLoading();
    } catch (error) {
        console.error('❌ Error loading products:', error);
        hideLoading();
        
        // Show user-friendly message
        const container = document.getElementById('bestsellers-grid');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 10px;">
                    <h3 style="color: #dc3545; margin-bottom: 20px;">⚠️ No Products Found</h3>
                    <p style="margin-bottom: 20px;">It looks like there are no products in the database yet.</p>
                    <p style="margin-bottom: 20px;"><strong>To add sample products:</strong></p>
                    <ol style="text-align: left; max-width: 500px; margin: 0 auto 20px;">
                        <li>Open browser console (Press F12)</li>
                        <li>Type: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">seedInitialProducts()</code></li>
                        <li>Press Enter</li>
                        <li>Wait for success message</li>
                        <li>Refresh the page</li>
                    </ol>
                    <button class="btn btn-primary" onclick="seedInitialProducts()" style="margin: 10px;">
                        <i class="fas fa-seedling"></i> Seed Products Now
                    </button>
                    <button class="btn btn-secondary" onclick="location.reload()" style="margin: 10px;">
                        <i class="fas fa-sync"></i> Refresh Page
                    </button>
                    <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
                        Error details: ${error.message}
                    </p>
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
        console.log('✅ Product added');
        showToast('Product added successfully!', 'success');
        await loadProducts();
        closeProductFormModal();
        hideLoading();
    } catch (error) {
        console.error('❌ Error adding product:', error);
        showToast('Error adding product: ' + error.message, 'error');
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
        console.log('✅ Product updated:', productId);
        showToast('Product updated successfully!', 'success');
        await loadProducts();
        closeProductFormModal();
        hideLoading();
    } catch (error) {
        console.error('❌ Error updating product:', error);
        showToast('Error updating product: ' + error.message, 'error');
        hideLoading();
    }
}

async function deleteProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
    }
    
    try {
        showLoading();
        await db.collection('products').doc(productId).delete();
        console.log('✅ Product deleted:', productId);
        showToast('Product deleted successfully!', 'success');
        await loadProducts();
        hideLoading();
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        showToast('Error deleting product: ' + error.message, 'error');
        hideLoading();
    }
}

// ====================================
// AUTHENTICATION FUNCTIONS
// ====================================

async function adminLogin(email, password) {
    try {
        showLoading();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        state.currentUser = userCredential.user;
        console.log('✅ Admin logged in:', state.currentUser.email);
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            hideLoading();
            navigateTo('admin-dashboard');
        }, 1000);
    } catch (error) {
        console.error('❌ Login error:', error);
        hideLoading();
        let errorMessage = 'Login failed. ';
        if (error.code === 'auth/wrong-password') {
            errorMessage += 'Incorrect password.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage += 'User not found.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'Invalid email address.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage += 'Network error. Check your internet connection.';
        } else {
            errorMessage += error.message;
        }
        showToast(errorMessage, 'error');
        document.getElementById('login-error').textContent = errorMessage;
    }
}

async function adminLogout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    try {
        await auth.signOut();
        state.currentUser = null;
        console.log('✅ Admin logged out');
        showToast('Logged out successfully', 'success');
        navigateTo('home');
    } catch (error) {
        console.error('❌ Logout error:', error);
        showToast('Error logging out: ' + error.message, 'error');
    }
}

auth.onAuthStateChanged(user => {
    state.currentUser = user;
    if (user) {
        console.log('✅ User authenticated:', user.email);
    } else {
        console.log('ℹ️ No user authenticated');
    }
    const currentPage = window.location.hash.slice(1) || 'home';
    if (currentPage === 'admin-dashboard' && !user) {
        navigateTo('admin-login');
    }
});

// ====================================
// UI RENDERING FUNCTIONS
// ====================================

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
                <p>No bestsellers yet. Click the button below to add sample products!</p>
                <button class="btn btn-primary" onclick="seedInitialProducts()" style="margin-top: 20px;">
                    <i class="fas fa-seedling"></i> Add Sample Products
                </button>
            </div>
        `;
        return;
    }
    container.innerHTML = bestsellers.slice(0, 6).map(product => createProductCardHTML(product)).join('');
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
            p.category.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
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
    
    if (countEl) {
        countEl.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p>No products found matching your filters.</p>';
        return;
    }
    
    container.innerHTML = filtered.map(product => createProductCardHTML(product)).join('');
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
                    ` : `
                        <span class="discounted">₹${product.price}</span>
                    `}
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
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
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
                    ` : `
                        <span class="discounted" style="font-size: 1.8rem;">₹${product.price}</span>
                    `}
                    <span style="color: #666; font-size: 1rem;">/${product.unit || 'unit'}</span>
                </div>
                <div class="rating">${renderStars(product.rating || 4.5)}</div>
                <p style="margin: 20px 0; line-height: 1.8;">${product.description}</p>
                ${features ? `
                    <div style="margin: 20px 0;">
                        <h4 style="margin-bottom: 10px;">Key Features:</h4>
                        <ul style="list-style: disc; margin-left: 20px;">
                            <li>${features}</li>
                        </ul>
                    </div>
                ` : ''}
                <div style="margin: 20px 0;">
                    <p><strong>Stock:</strong> ${product.stock || 0} units available</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="addToCart('${product.id}'); closeModal('product-modal');">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="proceedToOrder()">
                        <i class="fas fa-shopping-bag"></i> Order Now
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
    
    container.innerHTML = state.reviews.map(review => `
        <div class="review-card">
            <div class="rating">${renderStars(review.rating)}</div>
            <p>"${review.review}"</p>
            <div class="customer-name">${review.name}</div>
            <div style="color: #666; font-size: 0.9rem;">${review.product}</div>
        </div>
    `).join('');
}

function filterByCategory(category) {
    state.filters.category = category;
    navigateTo('products');
    renderProductsPage();
    
    const filterSelect = document.getElementById('category-filter');
    if (filterSelect) {
        filterSelect.value = category;
    }
}

// ====================================
// SHOPPING CART FUNCTIONS
// ====================================

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    
    if (product.stock <= 0) {
        showToast('Product out of stock', 'error');
        return;
    }
    
    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        state.cart.push({
            ...product,
            quantity: 1
        });
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
        showToast('Maximum stock reached', 'warning');
    }
    
    saveCartToLocalStorage();
    updateCartUI();
    renderCart();
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (badge) {
        badge.textContent = totalItems;
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty. Start shopping!</p>';
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
    
    if (totalEl) {
        totalEl.textContent = total.toFixed(2);
    }
}

function proceedToOrder() {
    if (state.cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    window.open(googleFormUrl, '_blank');
    showToast('Opening order form...', 'success');
}

function saveCartToLocalStorage() {
    localStorage.setItem('farm-cart', JSON.stringify(state.cart));
}

function loadCartFromLocalStorage() {
    const saved = localStorage.getItem('farm-cart');
    if (saved) {
        try {
            state.cart = JSON.parse(saved);
            updateCartUI();
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
        }
    }
}

// ====================================
// ADMIN PANEL FUNCTIONS
// ====================================

function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    
    if (state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products yet. Add your first product!</td></tr>';
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
                <button class="btn btn-primary" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-secondary" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function updateProductStats() {
    const totalEl = document.getElementById('total-products');
    const ordersEl = document.getElementById('total-orders');
    const revenueEl = document.getElementById('total-revenue');
    
    if (totalEl) totalEl.textContent = state.products.length;
    if (ordersEl) ordersEl.textContent = '0';
    if (revenueEl) revenueEl.textContent = '₹0';
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
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (productData.discountedPrice && productData.discountedPrice >= productData.price) {
        showToast('Discounted price must be less than original price', 'error');
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

// ====================================
// NAVIGATION & ROUTING
// ====================================

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

// ====================================
// MODAL FUNCTIONS
// ====================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
}

// ====================================
// DATA SEEDING FUNCTION
// ====================================

async function seedInitialProducts() {
    try {
        showLoading();
        console.log('🌱 Checking for existing products...');
        
        const existingProducts = await db.collection('products').limit(1).get();
        if (!existingProducts.empty) {
            console.log('ℹ️ Products already exist in database.');
            const answer = confirm('Products already exist. Do you want to add more sample products anyway?');
            if (!answer) {
                hideLoading();
                return;
            }
        }
        
        const sampleProducts = [
            {
                name: "Organic Whole Wheat Flour (Chakki Atta)",
                category: "Flour/Atta & Suji",
                price: 320,
                discountedPrice: 280,
                unit: "5kg",
                rating: 4.5,
                description: "Fresh chakki atta, soft and makes chapatis that stay fluffy and tasty for long. Truly good and healthy choice for your family.",
                features: ["High Fiber", "Zero Additives", "Stone Ground", "100% Whole Wheat"],
                image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
                stock: 50,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Traditional Basmati Rice",
                category: "Rice & Rice Products",
                price: 650,
                discountedPrice: 580,
                unit: "5kg",
                rating: 4.7,
                description: "Aged basmati rice with extra long grains. Aromatic fragrance and delicious taste. Cooks perfectly every time.",
                features: ["Aged Rice", "Extra Long Grain", "Aromatic", "Premium Quality"],
                image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
                stock: 45,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Organic Arhar/Tur Dal",
                category: "Pulses & Dal",
                price: 180,
                discountedPrice: 165,
                unit: "1kg",
                rating: 4.4,
                description: "Fresh toor dal rich in protein. Essential ingredient for traditional Indian dal preparations.",
                features: ["Protein Rich", "Quick Cooking", "No Polishing", "Natural Color"],
                image: "https://images.unsplash.com/photo-1596797882870-8c33deeaa9b2?w=400",
                stock: 70,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "A2 Cow Ghee",
                category: "Oils & Ghee",
                price: 650,
                discountedPrice: 599,
                unit: "500ml",
                rating: 4.6,
                description: "Pure A2 cow ghee made using traditional bilona method. Rich aroma and authentic taste.",
                features: ["A2 Milk", "Bilona Method", "Pure & Natural", "Rich Aroma"],
                image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
                stock: 40,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Organic Cold Pressed Mustard Oil",
                category: "Oils & Ghee",
                price: 380,
                discountedPrice: 349,
                unit: "1L",
                rating: 4.7,
                description: "Pure cold pressed mustard oil with natural pungency. Rich in omega-3 fatty acids.",
                features: ["Cold Pressed", "Omega-3 Rich", "No Chemicals", "Pure & Natural"],
                image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
                stock: 50,
                status: "active",
                bestseller: true,
                combo: false
            },
            {
                name: "Organic Turmeric Powder",
                category: "Spices & Masalas",
                price: 120,
                discountedPrice: 110,
                unit: "200g",
                rating: 4.5,
                description: "Pure turmeric powder with natural color and aroma. Known for anti-inflammatory properties.",
                features: ["Pure & Natural", "High Curcumin", "No Additives", "Aromatic"],
                image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
                stock: 80,
                status: "active",
                bestseller: false,
                combo: false
            }
        ];
        
        console.log(`🌱 Seeding ${sampleProducts.length} products...`);
        
        for (const product of sampleProducts) {
            await db.collection('products').add({
                ...product,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Added: ${product.name}`);
        }
        
        hideLoading();
        showToast(`${sampleProducts.length} products added successfully! Refreshing...`, 'success');
        
        // Reload products after 1 second
        setTimeout(() => {
            loadProducts();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        hideLoading();
        showToast('Error seeding products: ' + error.message, 'error');
        
        // Show detailed error message
        alert(`Error adding products:\n\n${error.message}\n\nMake sure:\n1. You've created Firestore database\n2. Security rules allow writing\n3. You're connected to the internet`);
    }
}

// ====================================
// EVENT LISTENERS
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Farm Products Website Loaded');
    console.log('📦 Loading cart from localStorage...');
    loadCartFromLocalStorage();
    
    console.log('🔄 Loading products from Firestore...');
    loadProducts();
    
    console.log('📋 Rendering categories...');
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
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
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
            showToast('Message sent successfully!', 'success');
            contactForm.reset();
        });
    }
    
    console.log('✅ All event listeners initialized');
    console.log('💡 TIP: To add sample products, click the button on the page or run in console: seedInitialProducts()');
});

// Make seed function globally available
window.seedInitialProducts = seedInitialProducts;
