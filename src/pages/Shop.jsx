import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard";
import { Filter, RotateCcw, Search, Grid, List, ChevronDown } from "lucide-react";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Sync parameter changes (e.g. from homepage category click)
    const catParam = searchParams.get("category");
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setLoading(true);

        const [productsSnap, categoriesSnap, subcategoriesSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "subcategories"))
        ]);

        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const categoriesData = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const subcategoriesData = subcategoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setProducts(productsData);
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);

        // Find max price for slider
        if (productsData.length > 0) {
          const maxPrice = Math.max(...productsData.map(p => Number(p.salePrice || p.price || 0)));
          setPriceRange(prev => ({ ...prev, max: maxPrice }));
        }

      } catch (error) {
        console.error("Error fetching catalog:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogData();
  }, []);

  // Filter Subcategories based on selected Category ID
  const filteredSubcategoriesList = useMemo(() => {
    if (!selectedCategory) return [];
    return subcategories.filter(sub => sub.categoryId === selectedCategory);
  }, [selectedCategory, subcategories]);

  // Reset Subcategory if it doesn't belong to current Category
  useEffect(() => {
    if (selectedCategory && filteredSubcategoriesList.length > 0) {
      const exists = filteredSubcategoriesList.some(sub => sub.id === selectedSubcategory);
      if (!exists) setSelectedSubcategory("");
    } else {
      setSelectedSubcategory("");
    }
  }, [selectedCategory, filteredSubcategoriesList]);

  // Extract unique brands list from active products
  const brandsList = useMemo(() => {
    const brandsSet = new Set();
    products.forEach(p => {
      if (p.brand) brandsSet.add(p.brand.trim());
    });
    return Array.from(brandsSet);
  }, [products]);

  // Filtered & Sorted Products calculation
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory || p.categoryName === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory) {
      result = result.filter(p => p.subcategory === selectedSubcategory || p.subcategoryName === selectedSubcategory);
    }

    // Brand filter
    if (selectedBrand) {
      result = result.filter(p => p.brand?.trim() === selectedBrand);
    }

    // Price range filter
    result = result.filter(p => {
      const price = Number(p.salePrice || p.price || 0);
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.salePrice || a.price) - Number(b.salePrice || b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.salePrice || b.price) - Number(a.salePrice || a.price));
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const tA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : Number(a.createdAt)) : 0;
        const tB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : Number(b.createdAt)) : 0;
        return tB - tA;
      });
    }

    return result;
  }, [products, search, selectedCategory, selectedSubcategory, selectedBrand, priceRange, sortBy]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedBrand("");
    if (products.length > 0) {
      const maxPrice = Math.max(...products.map(p => Number(p.salePrice || p.price || 0)));
      setPriceRange({ min: 0, max: maxPrice });
    }
    setSortBy("newest");
    setSearchParams({});
  };

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="container">
        
        {/* Title and Controls Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: "800" }}>Shop Collection</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
              Showing {processedProducts.length} premium products
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", smWidth: "auto", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary mobile-filter-btn"
              style={{ display: "none", alignItems: "center", gap: "6px" }}
            >
              <Filter size={18} /> Filters
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
                fontWeight: "600",
                outline: "none"
              }}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "40px" }} className="shop-layout-grid">
          
          {/* 1. FILTER SIDEBAR (Desktop) */}
          <aside className={`filter-sidebar ${showFilters ? "open" : ""}`} style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}>
            {/* Mobile Header */}
            <div style={{ display: "none", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }} className="mobile-filter-header">
              <h3 style={{ fontSize: "20px" }}>Filters</h3>
              <button onClick={() => setShowFilters(false)} className="btn btn-secondary" style={{ padding: "8px 12px" }}>Close</button>
            </div>

            {/* Search Filter */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "44px" }}
              />
              <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>

            {/* Category Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Categories</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => { setSelectedCategory(""); setSearchParams({}); }}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: selectedCategory === "" ? "var(--primary-glow)" : "none",
                    color: selectedCategory === "" ? "var(--primary)" : "var(--text-main)",
                    border: "none",
                    fontWeight: selectedCategory === "" ? "700" : "500",
                    cursor: "pointer",
                  }}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSearchParams({ category: cat.id }); }}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: selectedCategory === cat.id ? "var(--primary-glow)" : "none",
                      color: selectedCategory === cat.id ? "var(--primary)" : "var(--text-main)",
                      border: "none",
                      fontWeight: selectedCategory === cat.id ? "700" : "500",
                      cursor: "pointer",
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory Filter (Conditional) */}
            {selectedCategory && filteredSubcategoriesList.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Subcategories</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => setSelectedSubcategory("")}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: selectedSubcategory === "" ? "var(--primary-glow)" : "none",
                      color: selectedSubcategory === "" ? "var(--primary)" : "var(--text-main)",
                      border: "none",
                      fontWeight: selectedSubcategory === "" ? "700" : "500",
                      cursor: "pointer",
                    }}
                  >
                    All Subcategories
                  </button>
                  {filteredSubcategoriesList.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategory(sub.id)}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: selectedSubcategory === sub.id ? "var(--primary-glow)" : "none",
                        color: selectedSubcategory === sub.id ? "var(--primary)" : "var(--text-main)",
                        border: "none",
                        fontWeight: selectedSubcategory === sub.id ? "700" : "500",
                        cursor: "pointer",
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Filter */}
            {brandsList.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Brands</h4>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    outline: "none"
                  }}
                >
                  <option value="">All Brands</option>
                  {brandsList.map((brand, i) => (
                    <option key={i} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Max Price</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  type="range"
                  min="0"
                  max="150000"
                  step="500"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "var(--primary)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600" }}>
                  <span>₹0</span>
                  <span style={{ color: "var(--primary)" }}>Up to ₹{priceRange.max.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Reset Filters */}
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px" }}
            >
              <RotateCcw size={16} /> Reset Filters
            </button>
          </aside>

          {/* 2. CATALOG PRODUCTS LIST GRID */}
          <main>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: "380px", borderRadius: "24px" }}></div>
                ))}
              </div>
            ) : processedProducts.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }} className="shop-products-grid">
                {processedProducts.map((product, index) => (
                  <div key={product.id} className={`fade-in-up delay-${(index % 8) + 1}`}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "80px 40px",
                background: "var(--bg-card)",
                borderRadius: "24px",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px"
              }}>
                <Search size={48} style={{ color: "var(--text-muted)" }} />
                <h3 style={{ fontSize: "20px", fontWeight: "700" }}>No products found</h3>
                <p style={{ color: "var(--text-muted)", maxWidth: "400px" }}>
                  We couldn't find any products matching your active filters. Try adjusting your search query or reset filters.
                </p>
                <button onClick={handleResetFilters} className="btn btn-primary">Reset All Filters</button>
              </div>
            )}
          </main>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .shop-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-filter-btn {
            display: inline-flex !important;
          }
          .filter-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: var(--bg-app);
            z-index: 2000;
            padding: 32px 24px;
            overflow-y: auto;
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
            display: flex !important;
          }
          .filter-sidebar.open {
            transform: translateX(0);
          }
          .mobile-filter-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
