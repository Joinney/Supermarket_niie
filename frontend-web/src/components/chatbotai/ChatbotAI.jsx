import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecipeModal from './RecipeModal'; // Chuẩn hóa đường dẫn cùng cấp thư mục chatbotai

const ChatbotAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Chào bạn! Mình là trợ lý ảo của Demi Mart. Bạn cần tìm kiếm món ăn hay sản phẩm nào hôm nay ạ? 🤖', products: [] }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // QUẢN LÝ TRẠNG THÁI MODAL
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ recipeTitle: '', recipeText: '', products: [] });
    
    const chatEndRef = useRef(null);
    const navigate = useNavigate();

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

        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const PRODUCT_SERVICE_URL = isLocal ? 'http://localhost:5002' : 'https://productservice-n87v.onrender.com';
            
            const response = await axios.post(`${PRODUCT_SERVICE_URL}/api/chatbot/chat-recommend`, {
                message: userMessage
            });

            if (response.data && response.data.success) {
                const aiReply = response.data.reply;
                const recommendedProducts = response.data.products || [];

                // Kiểm tra xem nội dung phản hồi từ AI Backend có chứa thông tin công thức/cách làm hay không
                const hasRecipeContent = /Cách\s+làm|Nguyên\s+liệu/i.test(aiReply);
                
                // 🌟 PHÂN TÁCH HÀNH VI HIỂN THỊ THÔNG MINH THEO CÂU HỎI CỦA KHÁCH
                // Câu hỏi loại A: Hỏi đích danh cách làm, hướng dẫn nấu, cách nấu -> Bật Modal Popup ngay lập tức
                const isDirectActionQuery = /(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món)/i.test(userMessage);

                const newRecipeData = {
                    recipeTitle: userMessage,
                    recipeText: aiReply,
                    products: recommendedProducts
                };

                if (hasRecipeContent && recommendedProducts.length > 0 && isDirectActionQuery) {
                    // Hành vi 1: Chủ động bật Modal Popup lên màn hình chính
                    setModalData(newRecipeData);
                    setShowModal(true); 

                    setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: `🍳 Demi AI đã tìm thấy công thức và chuẩn bị sẵn gói nguyên liệu nấu ăn chi tiết ở bảng Popup lớn giữa màn hình rồi nhé!`,
                        products: [],
                        isRecipe: true, 
                        savedData: newRecipeData 
                    }]);
                } else if (hasRecipeContent && recommendedProducts.length > 0) {
                    // Hành vi 2: Khách hỏi "có những gì", "cần nguyên liệu gì" -> Hiện ở Form chat thường kèm nút nhấn nhanh cách làm
                    setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: aiReply, 
                        products: recommendedProducts,
                        isRecipe: false,
                        hasQuickRecipeLink: true, // 🌟 Cắm cờ sinh nút nhấn nhanh mở công thức nấu ăn
                        savedData: newRecipeData
                    }]);
                } else {
                    // Hành vi 3: Hỏi đáp mua sắm sản phẩm thông thường đơn thuần
                    setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: aiReply, 
                        products: recommendedProducts,
                        isRecipe: false,
                        hasQuickRecipeLink: false
                    }]);
                }
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.reply || 'Không nhận được phản hồi phù hợp.', products: [] }]);
            }
        } catch (error) {
            console.error('❌ Lỗi kết nối Chatbot:', error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Hệ thống trợ lý AI đang bận, bạn vui lòng thử lại sau giây lát nhé!', products: [] }]);
        } finally {
            setIsLoading(false); 
        }
    };

    const handleProductClick = (product) => {
        const countryCode = product.country_code || 'vn';
        const categorySlug = product.category_slug || 'all';
        navigate(`/${countryCode}/product/${categorySlug}/${product.id}`);
        setIsOpen(false);
        setShowModal(false);
    };

    const handleAddComboToCart = (productsList) => {
        productsList.forEach(product => {
            console.log(`🛒 Combo Add: ${product.name} - Số lượng chốt: ${product.quantity}`);
        });
        alert(`🎉 Đã thêm thành công combo ${productsList.length} nguyên liệu sạch vào giỏ hàng Demi Mart!`);
        setShowModal(false); 
    };

    const handleReopenModal = (savedData) => {
        setModalData(savedData);
        setShowModal(true);
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] font-sans">
            {/* BONG BÓNG CHAT NHỎ */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-all duration-300 hover:bg-emerald-800 hover:scale-110 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.655-.075.598.598 0 0 1-.154-.615l.914-3.346C3.651 15.621 3 13.889 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                </button>
            )}

            {isOpen && (
                <div className="flex h-[70vh] sm:h-[460px] w-[calc(100vw-32px)] sm:w-[330px] max-h-[550px] flex-col rounded-2xl bg-white shadow-2xl border border-gray-100 animate-fadeIn overflow-hidden">
                    {/* HEADER CHATBOX */}
                    <div className="flex items-center justify-between bg-emerald-700 p-3 sm:p-4 text-white flex-shrink-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative h-8 w-8 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold text-base shadow-sm">DM</div>
                            <div>
                                <h3 className="font-semibold text-xs sm:text-sm leading-tight">Demi Mart Assistant</h3>
                                <p className="text-[10px] sm:text-xs text-emerald-100 opacity-90">Trợ lý ảo thông minh RAG</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white p-1 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4 sm:h-5 sm:w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* LỊCH SỬ KHUNG CHAT */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 text-xs sm:text-sm">
                        {chatHistory.map((chat, index) => (
                            <div key={index} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-slate-800 shadow-sm leading-relaxed ${
                                    chat.role === 'user' 
                                        ? 'bg-emerald-700 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 rounded-bl-none whitespace-pre-line'
                                }`}>
                                    {chat.content}
                                    
                                    {/* 📦 HÀNH VI GỢI Ý THẺ SẢN PHẨM TRỰC TIẾP TRONG CHAT FORM */}
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

                                    {/* 🌟 NÚT NHẤN NHANH XEM CÁCH CHẾ BIẾN (Dành cho câu hỏi dạng "có những gì") */}
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

                                    {/* NÚT XEM LẠI CÔNG THỨC TRONG LỊCH SỬ CHAT NẾU LÀ CÂU HỎI TRA CỨU ĐÍCH DANH */}
                                    {chat.role === 'assistant' && chat.isRecipe && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                                            <button
                                                onClick={() => handleReopenModal(chat.savedData)}
                                                className="w-full flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.3} stroke="currentColor" className="h-3.5 w-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
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
                                    <span>Demi AI đang tìm kho...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* BOX NHẬP LIỆU GỬI TIN NHẮN */}
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

            {/* RECIPE MODAL POPUP COMPONENT */}
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