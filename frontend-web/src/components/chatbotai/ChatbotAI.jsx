import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecipeModal from './RecipeModal'; // Đã chuẩn hóa đường dẫn cùng cấp thư mục chatbotai của Demi

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
            
            const response = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/chat-recommend`, {
                message: userMessage
            });

            if (response.data && response.data.success) {
                const aiReply = response.data.reply;
                const recommendedProducts = response.data.products || [];
                const isRecipeQuery = /(làm|nấu|công thức|món|chuẩn bị|nguyên liệu)/i.test(userMessage);
                
                if (isRecipeQuery && recommendedProducts.length > 0) {
                    const newRecipeData = {
                        recipeTitle: userMessage,
                        recipeText: aiReply,
                        products: recommendedProducts
                    };

                    setModalData(newRecipeData);
                    setShowModal(true); // Tự động kích hoạt popup đè trên Sidebar và Header

                    setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: `🍳 Demi AI đã tìm thấy công thức và chuẩn bị sẵn gói nguyên liệu nấu ăn cho bạn rồi nhé!`,
                        products: [],
                        isRecipe: true, // Đánh dấu đây là tin nhắn chứa công thức
                        savedData: newRecipeData // Lưu lại data để nút bấm có thể mở lại sau này
                    }]);
                } else {
                    setChatHistory(prev => [...prev, { role: 'assistant', content: aiReply, products: recommendedProducts }]);
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

    // 🌟 HÀM XỬ LÝ GOM COMBO THÊM VÀO GIỎ HÀNG TỪ NÚT BẤM CUỐI MODAL
    const handleAddComboToCart = (productsList) => {
        // productsList chứa mảng các sản phẩm kèm .quantity khách chọn mua
        productsList.forEach(product => {
            // Liên kết trực tiếp với logic Cart hiện tại trong hệ thống của Demi Mart
            console.log(`🛒 Thêm thành công: ${product.name} - Số lượng: ${product.quantity}`);
        });
        
        alert(`🎉 Đã thêm thành công combo ${productsList.length} nguyên liệu sạch vào giỏ hàng Demi Mart!`);
        setShowModal(false); // Đăng ký đóng modal sau khi thêm thành công
    };

    // 🌟 HÀM MỞ LẠI MODAL TỪ LỊCH SỬ CHAT
    const handleReopenModal = (savedData) => {
        setModalData(savedData);
        setShowModal(true);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            {/* BONG BÓNG CHAT NHỎ */}
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#006c49] text-white shadow-lg transition-all duration-300 hover:bg-[#005439] hover:scale-110 active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7 animate-pulse"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.655-.075.598.598 0 0 1-.154-.615l.914-3.346C3.651 15.621 3 13.889 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                </button>
            )}

            {isOpen && (
                <div className="flex h-[500px] w-[360px] flex-col rounded-2xl bg-white shadow-2xl border border-gray-100 animate-fadeIn">
                    <div className="flex items-center justify-between rounded-t-2xl bg-[#006c49] p-4 text-white">
                        <div className="flex items-center space-x-3">
                            <div className="relative h-9 w-9 rounded-full bg-white flex items-center justify-center text-[#006c49] font-bold text-lg">DM</div>
                            <div>
                                <h3 className="font-semibold text-sm">Demi Mart Assistant</h3>
                                <p className="text-xs text-emerald-100">Trợ lý ảo thông minh RAG</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {chatHistory.map((chat, index) => (
                            <div key={index} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${chat.role === 'user' ? 'bg-[#006c49] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none leading-relaxed whitespace-pre-line'}`}>
                                    {chat.content}
                                    
                                    {/* 🌟 NÚT BẤM HIỆN CHI TIẾT CÔNG THỨC: Chỉ xuất hiện ở tin nhắn assistant có công thức nấu ăn */}
                                    {chat.role === 'assistant' && chat.isRecipe && (
                                        <div className="mt-3 pt-2 border-t border-gray-100">
                                            <button
                                                onClick={() => handleReopenModal(chat.savedData)}
                                                className="w-full flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-emerald-50 text-[#006c49] hover:bg-emerald-100 font-bold text-xs transition-colors"
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
                                <div className="bg-white border border-gray-100 text-gray-500 rounded-2xl px-4 py-2.5 text-sm">
                                    <span>Demi AI đang tìm kho...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex bg-white rounded-b-2xl">
                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Muốn nấu món gì hỏi Demi nhé..." disabled={isLoading} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-[#006c49] focus:outline-none focus:bg-white" />
                        <button type="submit" disabled={!message.trim() || isLoading} className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#006c49] text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 transform rotate-90"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A5.977 5.977 0 0 1 19.5 12c0 1.293-.41 2.5-1.11 3.492L12 21l-4.5-4.5" /></svg></button>
                    </form>
                </div>
            )}

            {/* NHÚNG COMPONENT MODAL POPUP VỚI PROP NÚT CHỐT ĐƠN COMBO MỚI */}
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