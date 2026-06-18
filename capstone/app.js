// ==========================================================================
// AETHERSHOP GLOBAL CONTROLLER & ROUTER
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // Global App State
    let products = [];
    let categories = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let activeFilters = {
        category: '',
        search: '',
        sort: 'default'
    };

    // DOM Mount Elements
    const appContainer = document.getElementById('app');
    const cartBadge = document.getElementById('cart-badge');
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const mobileDropdown = document.getElementById('mobile-dropdown');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    // ==========================================================================
    // INITIALIZATION & REST API FETCHES
    // ==========================================================================
    async function initApp() {
        // Render loading state initially
        appContainer.innerHTML = Views.Loading();
        updateCartBadge();
        
        try {
            // Fetch Products and Categories concurrently
            const [productsRes, categoriesRes] = await Promise.all([
                fetch('https://fakestoreapi.com/products'),
                fetch('https://fakestoreapi.com/products/categories')
            ]);

            if (!productsRes.ok || !categoriesRes.ok) {
                throw new Error('Store server responded with an error.');
            }

            products = await productsRes.json();
            categories = await categoriesRes.json();
            
            // Start routing engine
            router();
            
        } catch (error) {
            console.error('API Fetch Error:', error);
            renderAPIError();
        }
    }

    // Fallback error UI if mock API server is down
    function renderAPIError() {
        appContainer.innerHTML = `
            <div class="container" style="text-align: center; padding: 4rem 1.5rem;">
                <div style="width: 4.5rem; height: 4.5rem; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); border: 2px dashed #ef4444; color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                    <i data-lucide="wifi-off" style="width: 2.25rem; height: 2.25rem;"></i>
                </div>
                <h2>Connectivity Error</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">We are unable to connect to the product inventory API. Please verify your network connection and reload.</p>
                <button onclick="window.location.reload()" class="btn btn-primary">Retry Connection</button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ==========================================================================
    // CLIENT-SIDE HASH ROUTER
    // ==========================================================================
    function router() {
        const hash = window.location.hash || '#home';
        
        // Parse route and query parameters (e.g., #shop?category=electronics)
        const [path, queryString] = hash.split('?');
        const queryParams = parseQueryString(queryString);

        // Reset search/filter states if navigated away from shop
        if (path !== '#shop') {
            activeFilters.search = '';
            activeFilters.category = '';
            activeFilters.sort = 'default';
        }

        // Highlight header navigation
        updateActiveNav(path);
        closeMobileMenu();

        // ROUTE MATCHERS:
        
        // 1. Product Details view
        if (path.startsWith('#product/')) {
            const id = parseInt(path.split('/')[1]);
            const product = products.find(p => p.id === id);
            appContainer.innerHTML = Views.ProductDetails(product);
            bindDetailsPageEvents();
        }
        // 2. Shop Catalog view
        else if (path === '#shop') {
            // Apply category query parameter if set in URL hash
            if (queryParams.category) {
                activeFilters.category = decodeURIComponent(queryParams.category);
            }
            appContainer.innerHTML = Views.Shop(products, categories, activeFilters);
            bindShopPageEvents();
        }
        // 3. Cart view
        else if (path === '#cart') {
            appContainer.innerHTML = Views.Cart(cart, products);
            bindCartPageEvents();
        }
        // 4. Checkout view
        else if (path === '#checkout') {
            appContainer.innerHTML = Views.Checkout(cart, products);
            bindCheckoutPageEvents();
        }
        // 5. Success view
        else if (path === '#success') {
            appContainer.innerHTML = Views.Success();
        }
        // 6. Home view (Default)
        else {
            appContainer.innerHTML = Views.Home(products);
            bindHomePageEvents();
        }

        // Re-render SVG icons for dynamically injected markup
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Scroll to top on page navigation
        window.scrollTo(0, 0);
    }

    // Helper: Parse hash query parameters
    function parseQueryString(str) {
        const params = {};
        if (!str) return params;
        const pairs = str.split('&');
        for (let i = 0; i < pairs.length; i++) {
            const [key, value] = pairs[i].split('=');
            if (key) params[key] = value || '';
        }
        return params;
    }

    // Helper: Highlight active nav link in header
    function updateActiveNav(path) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            const route = link.getAttribute('data-route');
            if (route && path.startsWith(`#${route}`)) {
                link.classList.add('active');
            }
        });
    }

    // Route event listeners
    window.addEventListener('hashchange', router);

    // ==========================================================================
    // PAGE INTERACTION CONTROLLERS
    // ==========================================================================

    // --- HOME PAGE EVENTS ---
    function bindHomePageEvents() {
        // Home page catalog buttons bind automatically by default links
        bindQuickCartEvents();
    }

    // --- SHOP PAGE EVENTS ---
    function bindShopPageEvents() {
        const searchInput = document.getElementById('shop-search');
        const catSelect = document.getElementById('shop-category-select');
        const sortSelect = document.getElementById('shop-sort-select');
        const resetBtn = document.getElementById('reset-filters');

        // Text Search
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                activeFilters.search = e.target.value;
                debounceRenderShop();
            });
        }

        // Category Select
        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                activeFilters.category = e.target.value;
                // Sync to hash URL silently without reloading
                if (e.target.value) {
                    window.location.hash = `#shop?category=${encodeURIComponent(e.target.value)}`;
                } else {
                    window.location.hash = '#shop';
                }
            });
        }

        // Sorting Select
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                activeFilters.sort = e.target.value;
                renderShopContentOnly();
            });
        }

        // Reset Filters Button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                activeFilters.category = '';
                activeFilters.search = '';
                activeFilters.sort = 'default';
                window.location.hash = '#shop';
            });
        }

        bindQuickCartEvents();
    }

    // Debounce rendering shop to prevent lag on search typing
    let debounceTimer;
    function debounceRenderShop() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            renderShopContentOnly();
        }, 250);
    }

    // Renders just the catalog grid section during active filtering for speed
    function renderShopContentOnly() {
        const shopViewEl = document.querySelector('.shop-layout');
        if (shopViewEl) {
            // Re-render only catalog pane
            const catalogPanel = shopViewEl.querySelector('.catalog-panel');
            
            // Filter and sort catalog
            let filtered = products.filter(p => {
                const matchesCategory = !activeFilters.category || p.category === activeFilters.category;
                const matchesSearch = !activeFilters.search || 
                    p.title.toLowerCase().includes(activeFilters.search.toLowerCase()) || 
                    p.description.toLowerCase().includes(activeFilters.search.toLowerCase());
                return matchesCategory && matchesSearch;
            });

            if (activeFilters.sort === 'price-asc') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (activeFilters.sort === 'price-desc') {
                filtered.sort((a, b) => b.price - a.price);
            } else if (activeFilters.sort === 'rating') {
                filtered.sort((a, b) => b.rating.rate - a.rating.rate);
            }

            catalogPanel.outerHTML = `
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
            `;
            
            if (typeof lucide !== 'undefined') lucide.createIcons();
            bindQuickCartEvents();
        }
    }

    // Bind cart clicks on product grids
    function bindQuickCartEvents() {
        const quickAddBtns = document.querySelectorAll('.add-to-cart-quick');
        quickAddBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid navigating to details page
                const id = parseInt(btn.getAttribute('data-id'));
                addToCart(id);
            });
        });
    }

    // --- PRODUCT DETAILS PAGE EVENTS ---
    function bindDetailsPageEvents() {
        const addBtn = document.querySelector('.add-to-cart-detail');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const id = parseInt(addBtn.getAttribute('data-id'));
                addToCart(id);
            });
        }
    }

    // --- CART PAGE EVENTS ---
    function bindCartPageEvents() {
        const cartItemsPanel = document.querySelector('.cart-items-panel');
        if (!cartItemsPanel) return;

        cartItemsPanel.addEventListener('click', (e) => {
            const target = e.target;
            const card = target.closest('.cart-item-card');
            if (!card) return;

            const id = parseInt(card.getAttribute('data-id'));

            // Handle Qty Increment
            if (target.classList.contains('qty-plus-btn') || target.closest('.qty-plus-btn')) {
                updateItemQty(id, 1);
            }
            // Handle Qty Decrement
            else if (target.classList.contains('qty-minus-btn') || target.closest('.qty-minus-btn')) {
                updateItemQty(id, -1);
            }
            // Handle Item Removal
            else if (target.classList.contains('cart-item-remove-btn') || target.closest('.cart-item-remove-btn')) {
                removeFromCart(id);
            }
        });
    }

    // --- CHECKOUT PAGE EVENTS ---
    function bindCheckoutPageEvents() {
        const form = document.getElementById('checkout-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            const nameInput = document.getElementById('bill-name');
            const emailInput = document.getElementById('bill-email');
            const addressInput = document.getElementById('bill-address');
            const cityInput = document.getElementById('bill-city');
            const zipInput = document.getElementById('bill-zip');
            const cardInput = document.getElementById('bill-card');

            // Name validation
            if (!nameInput.value.trim()) {
                showInputError(nameInput, true);
                isValid = false;
            } else {
                showInputError(nameInput, false);
            }

            // Email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value.trim())) {
                showInputError(emailInput, true);
                isValid = false;
            } else {
                showInputError(emailInput, false);
            }

            // Address validation
            if (!addressInput.value.trim()) {
                showInputError(addressInput, true);
                isValid = false;
            } else {
                showInputError(addressInput, false);
            }

            // City validation
            if (!cityInput.value.trim()) {
                showInputError(cityInput, true);
                isValid = false;
            } else {
                showInputError(cityInput, false);
            }

            // ZIP validation
            if (!zipInput.value.trim()) {
                showInputError(zipInput, true);
                isValid = false;
            } else {
                showInputError(zipInput, false);
            }

            // Card validation (simple 16 digit check)
            const cleanCard = cardInput.value.replace(/\s+/g, '');
            if (!/^\d{16}$/.test(cleanCard)) {
                showInputError(cardInput, true);
                isValid = false;
            } else {
                showInputError(cardInput, false);
            }

            if (isValid) {
                // Success flow: Clear cart and transition route
                cart = [];
                saveCartState();
                window.location.hash = '#success';
                showToast('Order placed successfully! Thank you.', 'success');
            }
        });

        // Realtime typing input validation clear
        form.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                showInputError(input, false);
            });
        });
    }

    function showInputError(inputEl, isError) {
        const group = inputEl.closest('.form-group');
        if (isError) {
            group.classList.add('has-error');
        } else {
            group.classList.remove('has-error');
        }
    }

    // ==========================================================================
    // CART MUTATORS & LOCAL PERSISTENCE
    // ==========================================================================
    
    function addToCart(productId) {
        const existing = cart.find(item => item.productId === productId);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ productId, quantity: 1 });
        }

        saveCartState();
        showToast('Product added to shopping cart!', 'success');
    }

    function updateItemQty(productId, delta) {
        const item = cart.find(i => i.productId === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCartState();
            // Re-render cart page view dynamically
            appContainer.innerHTML = Views.Cart(cart, products);
            bindCartPageEvents();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    function removeFromCart(productId) {
        const index = cart.findIndex(i => i.productId === productId);
        if (index === -1) return;

        // Animate exit state in DOM before removing
        const itemCard = document.querySelector(`.cart-item-card[data-id="${productId}"]`);
        if (itemCard) {
            itemCard.style.opacity = '0';
            itemCard.style.transform = 'scale(0.95) translateY(-10px)';
            itemCard.style.height = '0';
            itemCard.style.padding = '0';
            itemCard.style.margin = '0';
            itemCard.style.border = 'none';
            itemCard.style.overflow = 'hidden';
            
            setTimeout(() => {
                cart.splice(index, 1);
                saveCartState();
                appContainer.innerHTML = Views.Cart(cart, products);
                bindCartPageEvents();
                if (typeof lucide !== 'undefined') lucide.createIcons();
                showToast('Product removed from cart', 'success');
            }, 250);
        } else {
            cart.splice(index, 1);
            saveCartState();
            appContainer.innerHTML = Views.Cart(cart, products);
            bindCartPageEvents();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    function saveCartState() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
    }

    function updateCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        // Fade badge animation effect
        cartBadge.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartBadge.style.transform = 'scale(1)';
        }, 150);
    }

    // ==========================================================================
    // TOAST NOTIFICATIONS UTILITY
    // ==========================================================================
    const toastContainer = document.getElementById('toast-container');
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        toast.innerHTML = `
            <i data-lucide="check-circle"></i>
            <span class="toast-message">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            toast.remove();
        }, 4500);
    }

    // ==========================================================================
    // MOBILE NAVIGATION
    // ==========================================================================
    function toggleMobileMenu() {
        const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
        mobileNavToggle.setAttribute('aria-expanded', !isExpanded);
        mobileNavToggle.classList.toggle('active');
        mobileDropdown.classList.toggle('active');
    }

    function closeMobileMenu() {
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        mobileNavToggle.classList.remove('active');
        mobileDropdown.classList.remove('active');
    }

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileMenu);
        
        // Close menu on navigation click
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // Initialize application catalog data
    initApp();
});
