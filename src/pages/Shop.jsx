import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard";
import { Filter, RotateCcw, Search, Grid, List, ChevronDown } from "lucide-react";
import { getPlaceholderImage } from "../utils/placeholder";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialSubcategory = searchParams.get("subcategory") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Sync parameter changes (e.g. from homepage or navbar click)
    const catParam = searchParams.get("category") || "";
    const subParam = searchParams.get("subcategory") || "";
    const searchParam = searchParams.get("search") || "";
    setSelectedCategory(catParam);
    setSelectedSubcategory(subParam);
    setSearch(searchParam);
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
    <div style={{ paddingTop: "100px", paddingBottom: "60px" }}>
      <div className="container">

        {/* 1. TOP FILTERS BAR (Glassmorphism card layout) */}
        <div
          className="glass-card"
          style={{
            padding: "24px",
            borderRadius: "24px",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            background: "var(--bg-card)"
          }}
        >
          {/* Row 2: Category horizontal pills */}
          <div>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", msOverflowStyle: "none" }} className="hide-scrollbar">
              <button
                onClick={() => { setSelectedCategory(""); setSearchParams({}); }}
                className={selectedCategory === "" ? "category-pill active" : "category-pill inactive"}
                style={{
                  background: selectedCategory === "" ? "var(--primary)" : undefined,
                  boxShadow: selectedCategory === "" ? "0 4px 14px var(--primary-glow)" : undefined
                }}
              >
                <Grid size={15} style={{ marginRight: "2px" }} />
                All Categories
              </button>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSearchParams({ category: cat.id }); }}
                    className={`category-pill ${isActive ? "active" : "inactive"}`}
                    style={{
                      background: isActive ? "var(--primary)" : undefined,
                      boxShadow: isActive ? "0 4px 14px var(--primary-glow)" : undefined,
                      padding: "5px 16px 5px 6px"
                    }}
                  >
                    <div style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: isActive ? "1px solid rgba(255,255,255,0.4)" : "1px solid var(--border-color)"
                    }}>
                      <img
                        src={cat.image || cat.icon || getPlaceholderImage(60, 60, cat.name)}
                        alt={cat.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Subcategory horizontal pills */}
          {selectedCategory && filteredSubcategoriesList.length > 0 && (
            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "16px" }}>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", msOverflowStyle: "none" }} className="hide-scrollbar">
                <button
                  onClick={() => setSelectedSubcategory("")}
                  className={selectedSubcategory === "" ? "subcategory-pill active" : "subcategory-pill inactive"}
                  style={{
                    background: selectedSubcategory === "" ? "var(--accent)" : undefined,
                    boxShadow: selectedSubcategory === "" ? "0 4px 12px rgba(244, 63, 94, 0.3)" : undefined
                  }}
                >
                  All Subcategories
                </button>
                {filteredSubcategoriesList.map((sub) => {
                  const isActive = selectedSubcategory === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategory(sub.id)}
                      className={`subcategory-pill ${isActive ? "active" : "inactive"}`}
                      style={{
                        background: isActive ? "var(--accent)" : undefined,
                        boxShadow: isActive ? "0 4px 12px rgba(244, 63, 94, 0.3)" : undefined
                      }}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. CATALOG PRODUCTS LIST GRID */}
        <main>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
              {[...Array(8)].map((_, i) => (
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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .category-pill {
          padding: 8px 18px;
          border-radius: 99px;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .category-pill.active {
          color: #ffffff;
          border: 1px solid transparent;
        }
        .category-pill.inactive {
          background: var(--bg-app);
          color: var(--text-main);
          border: 1px solid var(--border-color);
        }
        @media (hover: hover) {
          .category-pill.inactive:hover {
            background: var(--border-color) !important;
            transform: translateY(-1.5px);
          }
        }
        .subcategory-pill {
          padding: 6px 14px;
          border-radius: 99px;
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .subcategory-pill.active {
          color: #ffffff;
          border: 1px solid transparent;
        }
        .subcategory-pill.inactive {
          background: var(--bg-app);
          color: var(--text-main);
          border: 1px solid var(--border-color);
        }
        @media (hover: hover) {
          .subcategory-pill.inactive:hover {
            background: var(--border-color) !important;
            transform: translateY(-1.5px);
          }
        }
        @media (max-width: 768px) {
          .top-filters-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
