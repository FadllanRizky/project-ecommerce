import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/productApi';
import { useAuth } from '../contexts/AuthContext'; 
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal'; 
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Product({ onAddToCart, onAddToLoan, favorites = [], onToggleFavorite }) {
  const { token } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const itemsPerPage = 10; 

  useEffect(() => {
    getProducts()
      .then((response) => {
        let extractedProducts = [];
        if (Array.isArray(response.data)) {
          extractedProducts = response.data;
        } else if (response.data && Array.isArray(response.data.rows)) {
          extractedProducts = response.data.rows;
        } else if (response.data && typeof response.data === 'object') {
          extractedProducts = response.data.products || Object.values(response.data).find(Array.isArray) || [];
        }
        
        setProducts(extractedProducts);
      })
      .catch((err) => console.error("Gagal load database produk:", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const categories = Array.from(
    new Set(
      products.map((p) => {
        if (p.categories && p.categories.name) return p.categories.name;
        if (p.category && p.category.name) return p.category.name;
        return p.category_id;
      }).filter(Boolean)
    )
  );

  const filteredProducts = products.filter((product) => {
    const productName = product.name?.toLowerCase() || '';
    const productBrand = product.brand?.toLowerCase() || '';
    
    const currentProductCat = (
      product.categories?.name || 
      product.category?.name || 
      product.category_id || 
      ''
    ).toString().toLowerCase();
    
    const matchesSearch = productName.includes(searchTerm.toLowerCase()) || productBrand.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || currentProductCat === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleAddToLoan = (product) => {
    if (!token) {
      Swal.fire({
        title: 'Akses Ditolak',
        text: 'Bos harus login terlebih dahulu untuk mengajukan pinjaman!',
        icon: 'warning',
        background: '#FFF',
        color: '#374151',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    setIsModalOpen(false);

    if (onAddToLoan) {
      onAddToLoan(product);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const renderPageButton = (pageNumber) => (
    <button
      key={pageNumber}
      onClick={() => setCurrentPage(pageNumber)}
      className={`w-10 h-10 font-bold text-xs rounded-lg border transition-all ${
        currentPage === pageNumber 
          ? 'bg-orange-500 border-transparent text-white shadow-lg shadow-orange-200' 
          : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {pageNumber}
    </button>
  );

  const renderPageNumbers = () => {
    const pages = [];

    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(renderPageButton(i));
      }
    } else {
      if (currentPage <= 2) {
        pages.push(renderPageButton(1));
        pages.push(renderPageButton(2));
        pages.push(renderPageButton(3));
        pages.push(<span key="dots-end" className="text-gray-400 px-1 font-bold">...</span>);
        pages.push(renderPageButton(totalPages));
      } else if (currentPage >= totalPages - 1) {
        pages.push(renderPageButton(1));
        pages.push(<span key="dots-start" className="text-gray-400 px-1 font-bold">...</span>);
        pages.push(renderPageButton(totalPages - 2));
        pages.push(renderPageButton(totalPages - 1));
        pages.push(renderPageButton(totalPages));
      } else {
        pages.push(renderPageButton(1));
        pages.push(<span key="dots-start" className="text-gray-400 px-1 font-bold">...</span>);
        pages.push(renderPageButton(currentPage));
        pages.push(<span key="dots-end" className="text-gray-400 px-1 font-bold">...</span>);
        pages.push(renderPageButton(totalPages));
      }
    }

    return pages;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari nama produk atau brand bos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>

        <div className="relative w-full md:w-60 flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4 shrink-0 hidden sm:inline" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {typeof cat === 'string' ? cat.charAt(0).toUpperCase() + cat.slice(1) : cat}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-gray-400 text-xs">▼</div>
        </div>

      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-400">Tidak ada produk yang cocok dengan pencarian bos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map((product) => (
            <ProductCard 
              key={product.id || product._id} 
              product={product} 
              onDetail={(p) => {
                setSelectedProduct(p);
                setIsModalOpen(true);
              }} 
              onAddToCart={onAddToCart} 
              onAddToLoan={handleAddToLoan}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      {filteredProducts.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button 
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          
          {renderPageNumbers()}
          
          <button 
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <ProductDetailModal 
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={onAddToCart}
        onAddToLoan={handleAddToLoan} 
      />
    </div>
  );
}
