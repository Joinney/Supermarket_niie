import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

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

            if (trimmed.startsWith('Cách làm:') || trimmed.startsWith('Cách làm') || trimmed.match(/^(Bước\s\d+|Hướng dẫn nhanh|Nguyên liệu có sẵn|Tổng kết)/i)) {
                return (
                    <h4 key={index} className="text-base font-bold text-[#006c49] mt-5 mb-2 flex items-center bg-emerald-50/60 px-3 py-1.5 rounded-xl border-l-4 border-[#006c49]">
                        {trimmed}
                    </h4>
                );
            }

            if (/^\d+\./.test(trimmed)) {
                const matchNumber = trimmed.match(/^\d+/);
                return (
                    <div key={index} className="flex items-start space-x-2.5 my-3 pl-1">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mt-0.5 shadow-sm">
                            {matchNumber ? matchNumber[0] : index}
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

    // Chuẩn hóa, dọn sạch ký tự xuống dòng và loại bỏ toàn bộ các cụm lặp từ đầu chuỗi
    const displayTitle = data && data.recipeTitle 
        ? data.recipeTitle
            .replace(/[\n\r]/g, ' ') 
            .replace(/\s+/g, ' ')    
            .trim()
            .replace(/^(cách\s+làm|cách\s+nấu|cách|làm|nấu|combo\s+nguyên\s+liệu:)+/gi, '') 
            .replace(/(cần|những|gì|vậy|shop)/gi, '')
            .replace(/\?/g, '')
            .trim() 
        : '';

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
            <div className="relative w-full max-w-4xl h-[85vh] flex flex-col md:flex-row rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
                
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 rounded-full bg-white/90 p-2 text-gray-500 shadow-md border border-gray-100 transition-all hover:bg-rose-50 hover:text-rose-600"
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
                                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all"
                                >
                                    <div 
                                        onClick={() => onProductClick && onProductClick(prod)}
                                        className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
                                    >
                                        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-50 overflow-hidden border flex items-center justify-center relative">
                                            <img src={prod.image_url || 'https://placehold.co/150x150?text=Demi+Mart'} alt={prod.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-gray-800 truncate group-hover:text-[#006c49]">{prod.name}</h4>
                                            <p className="text-[11px] font-extrabold text-[#006c49] mt-0.5">{Number(prod.price || 0).toLocaleString('vi-VN')}đ</p>
                                        </div>
                                    </div>

                                    {isOutStock ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600 shrink-0">Hết hàng</span>
                                    ) : (
                                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                                            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                                                <button onClick={() => handleDecrease(index)} className="px-1.5 py-0.5 text-xs text-gray-500 font-bold">-</button>
                                                <span className="px-2 text-xs font-bold text-gray-800 min-w-[16px] text-center">{prod.quantity}</span>
                                                <button onClick={() => handleIncrease(index)} className="px-1.5 py-0.5 text-xs text-gray-500 font-bold">+</button>
                                            </div>
                                            <button 
                                                onClick={() => handleRemove(index)}
                                                className="text-gray-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50"
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
                            className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-[#006c49] text-white font-extrabold text-sm shadow-md transition-all duration-200 hover:bg-[#005439] disabled:bg-gray-200 disabled:text-gray-400"
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

export default RecipeModal;