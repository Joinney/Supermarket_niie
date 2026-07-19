import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// =========================================================================
// COMPONENT: RECIPE MODAL
// =========================================================================
const RecipeModal = ({ show, onClose, data, onProductClick, onAddComboToCart }) => {
    const [selectedProducts, setSelectedProducts] = useState([]);

    useEffect(() => {
        if (data && data.products) {
            const initialized = data.products.map(prod => ({
                ...prod,
                quantity: prod.stock > 0 ? 1 : 0 
            }));
            setSelectedProducts(initialized);
        }
    }, [data]);

    if (!show) return null;

    const handleIncrease = (index) => {
        setSelectedProducts(prev => prev.map((item, idx) => {
            if (idx === index) {
                if (item.quantity >= item.stock) return item; 
                return { ...item, quantity: item.quantity + 1 };
            }
            return item;
        }));
    };

    const handleDecrease = (index) => {
        setSelectedProducts(prev => prev.map((item, idx) => {
            if (idx === index && item.quantity > 1) {
                return { ...item, quantity: item.quantity - 1 };
            }
            return item;
        }));
    };

    const handleRemove = (index) => {
        setSelectedProducts(prev => prev.filter((_, idx) => idx !== index));
    };

    const totalPrice = selectedProducts.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);

    const handleConfirmAddToCart = () => {
        const itemsToBuy = selectedProducts.filter(item => item.quantity > 0);
        if (itemsToBuy.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để thêm vào giỏ hàng!");
            return;
        }
        if (onAddComboToCart) {
            onAddComboToCart(itemsToBuy);
        }
    };

   const formatRecipeText = (text) => {
        if (!text) return '';
        let cleanText = text.replace(/\*\*/g, '');
        const lines = cleanText.split('\n');
        
        return lines.map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={index} className="h-2" />;

            // 🔥 SỬA DÒNG NÀY: Mở rộng Regex để khớp với cả "Nguyên liệu chuẩn", "Cách làm:", "Hướng dẫn thực hiện",...
            if (trimmed.match(/^(cách\s+làm|nguyên\s+liệu|bước\s+\d+|hướng\s+dẫn|tổng\s+kết)/i)) {
                return (
                    <h4 key={index} className="text-base font-bold text-[#006c49] mt-5 mb-2 flex items-center bg-emerald-50/60 px-3 py-1.5 rounded-xl border-l-4 border-[#006c49]">
                        {trimmed}
                    </h4>
                );
            }

            if (/^\d+\./.test(trimmed)) {
                return (
                    <div key={index} className="flex items-start space-x-2.5 my-2 pl-1">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mt-0.5 shadow-sm">
                            {trimmed.match(/^\d+/)[0]}
                        </span>
                        <p className="text-gray-700 text-sm font-medium leading-relaxed flex-1">
                            {trimmed.replace(/^\d+\.\s*/, '')}
                        </p>
                    </div>
                );
            }

            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                return (
                    <div key={index} className="flex items-start space-x-2.5 my-1.5 pl-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#006c49] mt-2" />
                        <p className="text-gray-600 text-sm font-medium leading-relaxed">
                            {trimmed.replace(/^[-\*]\s*/, '')}
                        </p>
                    </div>
                );
            }

            return (
                <p key={index} className="text-gray-600 text-sm font-medium leading-relaxed my-1.5">
                    {trimmed}
                </p>
            );
        });
    };

    // Chuẩn hóa và triệt tiêu sạch mọi từ mồi lặp lại ở đầu chuỗi tiêu đề từ Backend gửi sang
    const displayTitle = data && data.recipeTitle 
        ? data.recipeTitle
            .replace(/[\n\r]/g, ' ') 
            .replace(/\s+/g, ' ')    
            .trim()
            .replace(/^(cách\s+|làm\s+|nấu\s+|combo\s+nguyên\s+liệu:\s*)+/gi, '')
            .replace(/(cần|những|gì|vậy|shop)/gi, '')
            .replace(/\?/g, '')
            .trim() 
        : '';

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4 font-sans">
            <div className="relative w-full max-w-4xl h-[85vh] flex flex-col md:flex-row rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 animate-scaleUp">
                
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 rounded-full bg-white/90 p-2 text-gray-500 shadow-md border border-gray-100 transition-all hover:bg-rose-50 hover:text-rose-600 hover:scale-105 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100 bg-gradient-to-br from-emerald-50/10 to-white">
                    <div className="flex items-center space-x-2 text-[#006c49] font-bold text-[11px] uppercase tracking-wider mb-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span> Thực đơn gợi ý từ Demi AI</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-4 capitalize tracking-tight">
                        Cách Làm {displayTitle}
                    </h2>
                    <div className="bg-white rounded-2xl p-5 border border-emerald-100/40 shadow-sm">
                        {formatRecipeText(data ? data.recipeText : '')}
                    </div>
                </div>

                <div className="w-full md:w-2/5 bg-gray-50 flex flex-col h-full overflow-hidden">
                    <div className="p-6 pb-3 border-b border-gray-200/50 bg-gray-50">
                        <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                            <span>Nguyên liệu sẵn có tại siêu thị</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">Tùy chỉnh số lượng hoặc bỏ bớt món theo nhu cầu của bạn</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
                        {selectedProducts.map((prod, index) => {
                            const isOutStock = prod.stock <= 0;
                            return (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-emerald-100"
                                >
                                    <div 
                                        onClick={() => onProductClick && onProductClick(prod)}
                                        className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
                                    >
                                        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                            <img src={prod.image_url || 'https://placehold.co/150x150?text=Demi+Mart'} alt={prod.name} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-gray-800 truncate group-hover:text-[#006c49] transition-colors">{prod.name}</h4>
                                            <p className="text-[11px] font-extrabold text-[#006c49] mt-0.5">{Number(prod.price || 0).toLocaleString('vi-VN')}đ</p>
                                        </div>
                                    </div>

                                    {isOutStock ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600 shrink-0">Hết hàng</span>
                                    ) : (
                                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                                            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                                                <button onClick={() => handleDecrease(index)} className="px-1.5 py-0.5 text-xs text-gray-500 hover:text-gray-800 font-bold">-</button>
                                                <span className="px-2 text-xs font-bold text-gray-800 min-w-[16px] text-center">{prod.quantity}</span>
                                                <button onClick={() => handleIncrease(index)} className="px-1.5 py-0.5 text-xs text-gray-500 hover:text-emerald-700 font-bold">+</button>
                                            </div>

                                            <button 
                                                onClick={() => handleRemove(index)}
                                                className="text-gray-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                                title="Bỏ nguyên liệu này"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 bg-white border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tổng tạm tính:</span>
                            <span className="text-lg font-black text-[#006c49]">{totalPrice.toLocaleString('vi-VN')}đ</span>
                        </div>
                        
                        <button
                            onClick={handleConfirmAddToCart}
                            disabled={selectedProducts.filter(p => p.quantity > 0).length === 0}
                            className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-[#006c49] text-white font-extrabold text-sm shadow-md shadow-emerald-900/10 transition-all duration-200 hover:bg-[#005439] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                            <span>Thêm tất cả vào giỏ hàng</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// =========================================================================
// COMPONENT: CHATBOT AI
// =========================================================================
const ChatbotAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const [showBackToTop, setShowBackToTop] = useState(false); 
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Chào bạn! Mình là trợ lý ảo của Demi Mart. Bạn cần tìm kiếm món ăn hay sản phẩm nào hôm nay ạ? 🤖', products: [] }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ recipeTitle: '', recipeText: '', products: [] });
    
    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [chatHistory, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage, products: [] }]);
        setIsLoading(true);

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const BASE_SERVICE_URL = isLocal ? 'http://localhost:5002' : 'https://productservice-n87v.onrender.com';
        
        const TARGET_ENDPOINT = `${BASE_SERVICE_URL}/api/v1/chatbot/chat-recommend`;

        try {
            // 🔥 TĂNG TIMEOUT TẦNG FRONTEND LÊN 30 GIÂY ĐỂ ĐỒNG BỘ LUỒNG AUTO-CRAWL PHÍA BACKEND
            const res = await axios.post(TARGET_ENDPOINT, { message: userMessage }, { timeout: 30000 });
            
            if (res.status === 200 && res.data && res.data.success) {
                const aiReply = res.data.reply;
                const recommendedProducts = res.data.products || [];
                const resTitle = res.data.recipeTitle || userMessage;

                const hasRecipeContent = /Cách\s+làm|Nguyên\s+liệu/i.test(aiReply);
                const isDirectActionQuery = /(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|có\s+những\s+gì|gồm\s+những|nguyên\s+liệu|cần\s+những)/i.test(userMessage);

                const newRecipeData = {
                    recipeTitle: resTitle, // Nhận tiêu đề đã được gọt sạch trùng lặp từ Backend gửi về
                    recipeText: aiReply,
                    products: recommendedProducts
                };

                if (hasRecipeContent && recommendedProducts.length > 0 && isDirectActionQuery) {
                    setModalData(newRecipeData);
                    setShowModal(true); 

                    setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: `🍳 Demi AI đã chuẩn bị sẵn gói nguyên liệu và hướng dẫn chi tiết của món này ở bảng Popup lớn giữa màn hình rồi nhé!`,
                        products: [],
                        isRecipe: true, 
                        savedData: newRecipeData 
                    }]);
                } else if (hasRecipeContent && recommendedProducts.length > 0) {
                    setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: aiReply, 
                        products: recommendedProducts,
                        isRecipe: false,
                        hasQuickRecipeLink: true, 
                        savedData: newRecipeData
                    }]);
                } else {
                    setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: aiReply, 
                        products: recommendedProducts,
                        isRecipe: false,
                        hasQuickRecipeLink: false
                    }]);
                }
            } else {
                throw new Error("Dữ liệu từ Node Gateway không hợp lệ hoặc rỗng");
            }
        } catch (error) {
            console.error('❌ Mạch AI lỗi hoặc mất kết nối. Đang kích hoạt luồng Fallback tại Client:', error);
            
            const cleanMsg = userMessage.toLowerCase();
            const isRecipe = /(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|nguyên\s+liệu)/i.test(cleanMsg);
            
            if (isRecipe) {
                const localText = `Nguyên liệu có sẵn:\n- Các gói nguyên liệu đi kèm hiện có sẵn tại siêu thị, bạn có thể kiểm tra trực tiếp qua công cụ tìm kiếm.\n\nCách làm:\n1. Sơ chế sạch nguyên liệu tươi sống.\n2. Thực hiện nấu chín và điều chỉnh gia vị vừa ăn phù hợp khẩu vị cá nhân.`;
                const mockData = { recipeTitle: userMessage, recipeText: localText, products: [] };
                
                setModalData(mockData);
                setShowModal(true);
                setChatHistory(prev => [...prev, { 
                    role: 'assistant', 
                    content: `🍳 Hệ thống mạng AI đang bận, Demi Mart đã khởi tạo khung hướng dẫn nấu ăn cơ bản tại Popup giữa màn hình cho bạn rồi nhé!`, 
                    products: [],
                    isRecipe: true,
                    savedData: mockData
                }]);
            } else {
                setChatHistory(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Xin chào! Mình là trợ lý ảo Demi Mart. Trục kết nối AI thông minh đang được bảo trì đồng bộ, bạn cần tìm kiếm mặt hàng nào vui lòng gõ trực tiếp tên sản phẩm vào thanh tìm kiếm ở Header phía trên cùng website nhé! 🛒', 
                    products: [] 
                }]);
            }
        } finally {
            setIsLoading(false); 
        }
    };

    const handleProductClick = (product) => {
        if (!product) return;
        const countryCode = product.country_code || 'vn';
        const categorySlug = product.category_slug || 'all';
        navigate(`/${countryCode}/product/${categorySlug}/${product.id}`);
        setIsOpen(false);
        setShowModal(false);
    };

    const handleAddComboToCart = (productsList) => {
        if (!productsList) return;
        productsList.forEach(product => {
            console.log(`🛒 Combo Add: ${product.name} - Số lượng: ${product.quantity}`);
        });
        alert(`🎉 Đã thêm thành công combo ${productsList.length} nguyên liệu sạch vào giỏ hàng Demi Mart!`);
        setShowModal(false); 
    };

    const handleReopenModal = (savedData) => {
        if (!savedData) return;
        setModalData(savedData);
        setShowModal(true);
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] font-sans flex flex-col items-center space-y-3">
            
            <button
                onClick={scrollToTop}
                style={{ backgroundColor: '#006c49' }}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 hover:brightness-110 hover:-translate-y-1 active:scale-95 border border-white/20 ${
                    showBackToTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-0 pointer-events-none'
                }`}
                title="Lên đầu trang"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
            </button>

            {!isOpen && (
                <div className="relative w-14 h-14 flex items-center justify-center">
                    <button 
                        onClick={() => { setIsOpen(true); setIsMenuOpen(false); }}
                        style={{ 
                            transform: isMenuOpen ? 'translateY(-85px) scale(1)' : 'translateY(0) scale(0)', 
                            opacity: isMenuOpen ? 1 : 0,
                            transitionDelay: isMenuOpen ? '0ms' : '100ms'
                        }}
                        className="absolute h-12 w-12 flex items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl border border-white/20 transition-all duration-300 hover:bg-emerald-800 hover:scale-110 active:scale-95 text-xl"
                        title="Trợ lý AI"
                    >
                        🤖
                    </button>

                    <a 
                        href="https://zalo.me/your_id" 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                            transform: isMenuOpen ? 'translate(-65px, -65px) scale(1)' : 'translate(0, 0) scale(0)', 
                            opacity: isMenuOpen ? 1 : 0,
                            transitionDelay: isMenuOpen ? '50ms' : '50ms'
                        }}
                        className="absolute h-12 w-12 flex items-center justify-center rounded-full bg-[#0068ff] text-white font-bold text-xs shadow-xl border border-white/20 transition-all duration-300 hover:bg-blue-700 hover:scale-110 active:scale-95"
                        title="Zalo Chat"
                    >
                        Zalo
                    </a>

                    <a 
                        href="tel:0123456789" 
                        style={{ 
                            transform: isMenuOpen ? 'translateX(-85px) scale(1)' : 'translateX(0) scale(0)', 
                            opacity: isMenuOpen ? 1 : 0,
                            transitionDelay: isMenuOpen ? '100ms' : '0ms'
                        }}
                        className="absolute h-12 w-12 flex items-center justify-center rounded-full bg-red-600 text-white shadow-xl border border-white/20 transition-all duration-300 hover:bg-red-700 hover:scale-110 active:scale-95 text-lg"
                        title="Hotline"
                    >
                        📞
                    </a>

                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 active:scale-90 select-none border border-white/10 ${
                            isMenuOpen 
                                ? 'bg-slate-600 rotate-45 hover:bg-slate-700' 
                                : 'bg-emerald-700 hover:bg-emerald-800 hover:scale-105'
                        }`}
                    >
                        {isMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.655-.075.598.598 0 0 1-.154-.615l.914-3.346C3.651 15.621 3 13.889 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                        )}
                    </button>
                </div>
            )}

            {isOpen && (
                <div className="flex h-[70vh] sm:h-[460px] w-[calc(100vw-32px)] sm:w-[330px] max-h-[550px] flex-col rounded-2xl bg-white shadow-2xl border border-gray-100 animate-fadeIn overflow-hidden">
                    <div className="flex items-center justify-between bg-emerald-700 p-3 sm:p-4 text-white flex-shrink-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative h-8 w-8 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold text-base shadow-sm">DM</div>
                            <div>
                                <h3 className="font-semibold text-xs sm:text-sm leading-tight">Demi Mart Assistant</h3>
                                <p className="text-[10px] sm:text-xs text-emerald-100 opacity-90">Trợ lý ảo thông minh RAG</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white p-1 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4sm:h-5 sm:w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 text-xs sm:text-sm">
                        {chatHistory.map((chat, index) => (
                            <div key={index} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-slate-800 shadow-sm leading-relaxed ${
                                    chat.role === 'user' 
                                        ? 'bg-emerald-700 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 rounded-bl-none whitespace-pre-line'
                                }`}>
                                    {chat.content}
                                    
                                    {chat.role === 'assistant' && chat.products && chat.products.length > 0 && !chat.isRecipe && (
                                        <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sản phẩm có sẵn:</p>
                                            {chat.products.map((p, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => handleProductClick(p)}
                                                    className="flex items-center space-x-2 p-1.5 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer hover:border-emerald-200 transition-colors"
                                                >
                                                    <img src={p.image_url || 'https://placehold.co/50x50?text=Demi'} alt={p.name} className="h-8 w-8 rounded-lg object-cover bg-white border border-gray-100" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-bold text-gray-800 truncate">{p.name}</p>
                                                        <p className="text-[10px] font-extrabold text-emerald-700 mt-0.5">{Number(p.price || 0).toLocaleString('vi-VN')}đ</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {chat.role === 'assistant' && chat.hasQuickRecipeLink && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                                            <button
                                                onClick={() => handleReopenModal(chat.savedData)}
                                                className="w-full flex items-center justify-center space-x-1 py-1 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-[10px] sm:text-[11px] transition-colors shadow-sm"
                                            >
                                                <span>👩‍🍳 Xem hướng dẫn chế biến chi tiết</span>
                                            </button>
                                        </div>
                                    )}

                                    {chat.role === 'assistant' && chat.isRecipe && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                                            <button
                                                onClick={() => handleReopenModal(chat.savedData)}
                                                className="w-full flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors"
                                            >
                                                <span>Xem chi tiết công thức</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 text-gray-400 rounded-2xl px-3 py-2 text-xs">
                                    <span>Demi AI đang xử lý...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-2 sm:p-3 border-t border-gray-100 flex bg-white flex-shrink-0">
                        <input 
                            type="text" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            placeholder="Hỏi sản phẩm hoặc công thức món ăn..." 
                            disabled={isLoading} 
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm focus:border-emerald-700 focus:outline-none focus:bg-white transition-all disabled:opacity-60" 
                        />
                        <button 
                            type="submit" 
                            disabled={!message.trim() || isLoading} 
                            className="ml-2 flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white disabled:opacity-40 transition-opacity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4 sm:h-5 sm:w-5 transform rotate-90">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A5.977 5.977 0 0 1 19.5 12c0 1.293-.41 2.5-1.11 3.492L12 21l-4.5-4.5" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            <RecipeModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                data={modalData} 
                onProductClick={handleProductClick} 
                onAddComboToCart={handleAddComboToCart}
            />
        </div>
    ); 
};

export default ChatbotAI;