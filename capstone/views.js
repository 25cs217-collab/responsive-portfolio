// ==========================================================================
   AETHERSHOP MODULAR VIEW TEMPLATES
   ========================================================================== */
const Views = {
    
    // --------------------------------------------------------------------------
    // VIEW: LOADING SKELETON
    // --------------------------------------------------------------------------
    Loading: () => {
        return `
            <div class="page-view container">
                <div class="page-title-row">
                    <div class="skeleton-text" style="width: 140px; height: 1.5rem; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton-text" style="width: 200px; height: 2.5rem;"></div>
                </div>
                <div class="product-grid">
                    ${Array(6).fill().map(() => `
                        <div class="shimmer-card">
                            <div class="shimmer-img"></div>
                            <div class="shimmer-text shimmer-title"></div>
                            <div class="shimmer-text shimmer-rating"></div>
                            <div class="shimmer-text shimmer-price" style="margin-top: auto;"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // VIEW: HOME PAGE
    // --------------------------------------------------------------------------
    Home: (products) => {
        // Find a couple of cool electronics items to feature
        const featured = products.filter(p => p.category === 'electronics').slice(0, 4);
        
        return `
            <div class="page-view container">
                <!-- Hero Banner -->
                <section class="home-hero">
                    <span class="hero-tag">Summer Collection 2026</span>
                    <h2 class="hero-title">Experience Premium Quality Products & Modern Styling</h2>
                    <p class="hero-desc">Explore the finest electronics, jewelry, and clothing catalog curated with professional-grade craftsmanship.</p>
                    <a href="#shop" class="btn btn-primary">
                        <span>Explore Shop Catalog</span>
                        <i data-lucide="arrow-right"></i>
                    </a>
                </section>

                <!-- Categories -->
                <section class="featured-categories">
                    <h3 class="section-subtitle">Browse Categories</h3>
                    <div class="categories-grid">
                        <a href="#shop?category=electronics" class="category-card">
                            <div class="category-icon-wrapper"><i data-lucide="smartphone"></i></div>
                            <h3>Electronics</h3>
                        </a>
                        <a href="#shop?category=jewelery" class="category-card">
                            <div class="category-icon-wrapper"><i data-lucide="gem"></i></div>
                            <h3>Jewelry</h3>
                        </a>
                        <a href="#shop?category=men's clothing" class="category-card">
                            <div class="category-icon-wrapper"><i data-lucide="shirt"></i></div>
                            <h3>Men's Clothing</h3>
                        </a>
                        <a href="#shop?category=women's clothing" class="category-card">
                            <div class="category-icon-wrapper"><i data-lucide="shopping-bag"></i></div>
                            <h3>Women's Clothing</h3>
                        </a>
                    </div>
                </section>

                <!-- Featured Section -->
                <section class="featured-products-section" style="margin-bottom: 2rem;">
                    <h3 class="section-subtitle">Top Featured Picks</h3>
                    <div class="product-grid">
                        ${featured.map(product => Views._ProductCard(product)).join('')}
                    </div>
                </section>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // VIEW: SHOP CATALOG PAGE
    // --------------------------------------------------------------------------
    Shop: (products, categories, activeFilters) => {
        const { category, search, sort } = activeFilters;
        
        // Filter catalog items
        let filtered = products.filter(product => {
            const matchesCategory = !category || product.category === category;
            const matchesSearch = !search || 
                product.title.toLowerCase().includes(search.toLowerCase()) || 
                product.description.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        // Apply sorting
        if (sort === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sort === 'rating') {
            filtered.sort((a, b) => b.rating.rate - a.rating.rate);
        }

        return `
            <div class="page-view container">
                <div class="page-title-row">
                    <h2 class="page-title">Shop Catalog</h2>
                </div>

                <div class="shop-layout">
                    <!-- Filters Sidebar -->
                    <aside class="filters-sidebar">
                        <div class="filters-header">
                            <h3><i data-lucide="sliders-horizontal"></i> Filters</h3>
                            <span class="reset-filters-btn" id="reset-filters">Clear All</span>
                        </div>

                        <!-- Search Box -->
                        <div class="filter-group">
                            <h4>Keyword Search</h4>
                            <div class="sidebar-search-box">
                                <i data-lucide="search"></i>
                                <input type="text" id="shop-search" placeholder="Search keywords..." value="${search || ''}">
                            </div>
                        </div>

                        <!-- Category Selector -->
                        <div class="filter-group">
                            <h4>Category</h4>
                            <select id="shop-category-select" class="filter-category-select">
                                <option value="">All Categories</option>
                                ${categories.map(cat => `
                                    <option value="${cat}" ${category === cat ? 'selected' : ''}>
                                        ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Sorting Selection -->
                        <div class="filter-group">
                            <h4>Sort By</h4>
                            <select id="shop-sort-select" class="filter-sort-select">
                                <option value="default" ${sort === 'default' ? 'selected' : ''}>Default</option>
                                <option value="price-asc" ${sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
                                <option value="price-desc" ${sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
                                <option value="rating" ${sort === 'rating' ? 'selected' : ''}>Top Rated</option>
                            </select>
                        </div>
                    </aside>

                    <!-- Catalog Panel -->
                    <div class="catalog-panel">
                        <div class="catalog-header">
                            <span>Showing ${filtered.length} products</span>
                        </div>

                        ${filtered.length === 0 ? `
                            <div class="catalog-empty">
                                <i data-lucide="package-search"></i>
                                <h3>No products found</h3>
                                <p>We couldn't find matches for your search. Try resetting filters.</p>
                            </div>
                        ` : `
                            <div class="product-grid">
                                ${filtered.map(product => Views._ProductCard(product)).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // VIEW: PRODUCT DETAILS PAGE
    // --------------------------------------------------------------------------
    ProductDetails: (product) => {
        if (!product) return `<div class="container text-center"><h3>Product not found</h3></div>`;

        const stars = Views._GenerateStars(product.rating.rate);

        return `
            <div class="page-view container">
                <div class="page-title-row" style="margin-bottom: 2rem;">
                    <a href="#shop" class="back-link" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 500; font-size: 0.9rem; color: var(--text-muted);">
                        <i data-lucide="arrow-left" style="width: 1rem; height: 1rem;"></i> Back to Shop Catalog
                    </a>
                </div>

                <div class="detail-grid">
                    <!-- Image Card -->
                    <div class="detail-image-panel">
                        <img src="${product.image}" alt="${product.title}">
                    </div>

                    <!-- Info Card -->
                    <div class="detail-info-panel">
                        <span class="detail-category-badge">${product.category}</span>
                        <h2 class="detail-title">${product.title}</h2>
                        
                        <div class="detail-rating-row">
                            <div class="detail-rating-stars">${stars}</div>
                            <span class="detail-rating-text">${product.rating.rate} / 5 (${product.rating.count} customer reviews)</span>
                        </div>

                        <div class="detail-price">$${product.price.toFixed(2)}</div>
                        
                        <h3 class="detail-desc-title">Product Description</h3>
                        <p class="detail-desc">${product.description}</p>

                        <div class="detail-actions-row">
                            <button class="btn btn-primary add-to-cart-detail" data-id="${product.id}">
                                <i data-lucide="shopping-cart"></i>
                                <span>Add to Cart</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // VIEW: SHOPPING CART PAGE
    // --------------------------------------------------------------------------
    Cart: (cartItems, products) => {
        const cartProducts = cartItems.map(item => {
            const product = products.find(p => p.id === item.productId);
            return { ...product, quantity: item.quantity };
        }).filter(item => item.id); // Guard against missing products

        const subtotal = cartProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08; // 8% Tax
        const total = subtotal + tax;

        if (cartProducts.length === 0) {
            return `
                <div class="page-view container">
                    <div class="cart-empty">
                        <i data-lucide="shopping-cart"></i>
                        <h3>Your Cart is Empty</h3>
                        <p>Browse our catalog and add items you like to the cart.</p>
                        <a href="#shop" class="btn btn-primary">
                            <span>Browse Shop Catalog</span>
                        </a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="page-view container">
                <div class="page-title-row">
                    <h2 class="page-title">Shopping Cart</h2>
                </div>

                <div class="cart-layout">
                    <!-- Cart items list (Flexbox) -->
                    <div class="cart-items-panel">
                        ${cartProducts.map(item => `
                            <div class="cart-item-card" data-id="${item.id}">
                                <div class="cart-item-img-box">
                                    <img src="${item.image}" alt="${item.title}">
                                </div>
                                
                                <div class="cart-item-details">
                                    <h3 class="cart-item-title"><a href="#product/${item.id}">${item.title}</a></h3>
                                    <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                                </div>

                                <!-- Quantity Controls -->
                                <div class="quantity-control">
                                    <button class="qty-btn qty-minus-btn" aria-label="Decrease quantity">
                                        <i data-lucide="minus"></i>
                                    </button>
                                    <span class="qty-val">${item.quantity}</span>
                                    <button class="qty-btn qty-plus-btn" aria-label="Increase quantity">
                                        <i data-lucide="plus"></i>
                                    </button>
                                </div>

                                <button class="cart-item-remove-btn" aria-label="Remove item">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Cart summary panel (right side) -->
                    <aside class="cart-summary-panel">
                        <h3 class="summary-title">Order Summary</h3>
                        
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>$${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Tax (8%)</span>
                            <span>$${tax.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Shipping</span>
                            <span style="color: var(--accent-emerald); font-weight: 600;">FREE</span>
                        </div>
                        
                        <div class="summary-row total-row">
                            <span>Total</span>
                            <span class="detail-price">$${total.toFixed(2)}</span>
                        </div>

                        <a href="#checkout" class="btn btn-primary checkout-btn">
                            <span>Proceed to Checkout</span>
                            <i data-lucide="credit-card"></i>
                        </a>
                    </aside>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // VIEW: CHECKOUT PAGE
    // --------------------------------------------------------------------------
    Checkout: (cartItems, products) => {
        const cartProducts = cartItems.map(item => {
            const product = products.find(p => p.id === item.productId);
            return { ...product, quantity: item.quantity };
        }).filter(item => item.id);

        const subtotal = cartProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        if (cartProducts.length === 0) {
            return `<script>window.location.hash = 'shop';</script>`;
        }

        return `
            <div class="page-view container">
                <div class="page-title-row">
                    <h2 class="page-title">Secure Checkout</h2>
                </div>

                <div class="checkout-grid">
                    <!-- Shipping Form Container -->
                    <section class="checkout-form-container">
                        <h3 class="checkout-form-title">Shipping & Billing Details</h3>
                        
                        <form id="checkout-form" class="checkout-form" novalidate>
                            <div class="form-row-2col">
                                <div class="form-group">
                                    <label for="bill-name">Full Name</label>
                                    <input type="text" id="bill-name" placeholder="John Doe" required>
                                    <span class="form-error">Please enter your full name</span>
                                </div>
                                <div class="form-group">
                                    <label for="bill-email">Email Address</label>
                                    <input type="email" id="bill-email" placeholder="john@example.com" required>
                                    <span class="form-error">Please enter a valid email address</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="bill-address">Shipping Address</label>
                                <input type="text" id="bill-address" placeholder="123 Ocean Street" required>
                                <span class="form-error">Please enter your shipping address</span>
                            </div>

                            <div class="form-row-2col">
                                <div class="form-group">
                                    <label for="bill-city">City</label>
                                    <input type="text" id="bill-city" placeholder="Chennai" required>
                                    <span class="form-error">Please enter your city</span>
                                </div>
                                <div class="form-group">
                                    <label for="bill-zip">ZIP / Postal Code</label>
                                    <input type="text" id="bill-zip" placeholder="600001" required>
                                    <span class="form-error">Please enter your ZIP code</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="bill-card">Credit Card Number</label>
                                <input type="text" id="bill-card" placeholder="4111 2222 3333 4444" required>
                                <span class="form-error">Please enter a valid 16-digit card number</span>
                            </div>

                            <button type="submit" class="btn btn-primary submit-order-btn" style="margin-top: 1rem;">
                                <span>Place Secure Order</span>
                                <i data-lucide="shield-check"></i>
                            </button>
                        </form>
                    </section>

                    <!-- Order Summary Cards (right) -->
                    <aside class="order-summary-card">
                        <h3 class="summary-title" style="font-size: 1.05rem;">My Order</h3>
                        
                        <div class="order-items-list">
                            ${cartProducts.map(item => `
                                <div class="order-item-row">
                                    <span class="order-item-name" title="${item.title}">${item.title} (x${item.quantity})</span>
                                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>

                        <div class="summary-row" style="font-size: 0.85rem; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 0.75rem;">
                            <span>Subtotal</span>
                            <span>$${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row" style="font-size: 0.85rem;">
                            <span>Tax (8%)</span>
                            <span>$${tax.toFixed(2)}</span>
                        </div>
                        <div class="summary-row total-row" style="margin-bottom: 0; padding-top: 0.75rem; font-size: 1.1rem;">
                            <span>Grand Total</span>
                            <span style="color: var(--accent-emerald); font-weight: 800;">$${total.toFixed(2)}</span>
                        </div>
                    </aside>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // VIEW: ORDER SUCCESS CONFIRMATION
    // --------------------------------------------------------------------------
    Success: () => {
        return `
            <div class="page-view container">
                <div class="order-success-panel">
                    <div class="success-check-icon">
                        <i data-lucide="check-circle-2"></i>
                    </div>
                    <h2 class="success-title">Order Placed Successfully!</h2>
                    <p class="success-desc">Thank you for shopping with AetherShop. We have received your order and will email your shipping details shortly.</p>
                    <a href="#shop" class="btn btn-primary">
                        <span>Continue Shopping</span>
                    </a>
                </div>
            </div>
        `;
    },

    // ==========================================================================
    // INTERNAL SUB-TEMPLATES HELPERS
    // ==========================================================================
    
    // Product grid item card helper template
    _ProductCard: (product) => {
        const ratingRate = product.rating ? product.rating.rate : 0;
        const ratingCount = product.rating ? product.rating.count : 0;
        const starHTML = Views._GenerateStars(ratingRate);

        return `
            <article class="product-card">
                <div class="product-image-box">
                    <span class="product-category-tag">${product.category}</span>
                    <a href="#product/${product.id}">
                        <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy">
                    </a>
                </div>
                
                <div class="product-info-box">
                    <h4 class="product-card-title"><a href="#product/${product.id}">${product.title}</a></h4>
                    <div class="product-rating-row">
                        ${starHTML}
                        <span class="product-rating-count">(${ratingCount})</span>
                    </div>
                    
                    <div class="product-footer-row">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        <button class="add-cart-icon-btn add-to-cart-quick" data-id="${product.id}" title="Quick Add to Cart" aria-label="Add to cart">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    },

    // Star icon string generator
    _GenerateStars: (rate) => {
        const fullStars = Math.floor(rate);
        const hasHalf = rate % 1 >= 0.5;
        let html = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                html += `<i data-lucide="star" style="fill: currentColor;"></i>`;
            } else if (i === fullStars + 1 && hasHalf) {
                html += `<i data-lucide="star-half" style="fill: currentColor;"></i>`;
            } else {
                html += `<i data-lucide="star"></i>`;
            }
        }
        return html;
    }
};
