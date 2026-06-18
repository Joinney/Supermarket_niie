import os
from typing import List, Dict, Optional
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

# Nạp toàn bộ biến môi trường từ file .env vào os.environ
load_dotenv()

app = FastAPI(title="AI Demi Mart Recommendation Service")

# ĐỌC BIẾN MÔI TRƯỜNG: Lấy dữ liệu từ file .env, nếu thiếu sẽ tự động dùng giá trị fallback
API_KEY = os.getenv("DEEPSEEK_API_KEY")
BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.iamhc.cn/v1")
DEFAULT_LLM_MODEL = os.getenv("DEEPSEEK_MODEL", "DeepSeek-V4-Flash")

# Kiểm tra điều kiện bắt buộc
if not API_KEY:
    raise RuntimeError("❌ LỖI KHỞI ĐỘNG: Chưa cấu hình DEEPSEEK_API_KEY trong file .env!")


# =========================================================================
# GIAO DIỆN TRANG CHỦ LANDING PAGE CHO AI SERVICE
# =========================================================================
@app.get("/", response_class=HTMLResponse)
async def home_page():
    html_content = """
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demi Mart AI Service</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Plus Jakarta Sans', sans-serif;
                background-color: #f8fafc;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .card {
                background: white;
                padding: 3rem;
                border-radius: 16px;
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
                text-align: center;
                max-width: 600px;
                width: 90%;
            }
            h1 {
                color: #046A38;
                font-size: 2.5rem;
                margin-top: 0;
                margin-bottom: 0.5rem;
                font-weight: 700;
            }
            p {
                color: #64748b;
                font-size: 1.2rem;
                margin-bottom: 2rem;
            }
            .btn {
                display: inline-block;
                background-color: #046A38;
                color: white;
                text-decoration: none;
                padding: 12px 32px;
                font-size: 1.1rem;
                font-weight: 600;
                border-radius: 50px;
                box-shadow: 0 4px 12px rgba(4, 106, 56, 0.2);
                transition: all 0.3s ease;
            }
            .btn:hover {
                background-color: #03522b;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(4, 106, 56, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Demi Mart AI Service</h1>
            <p>Hệ thống đang hoạt động xanh mướt! 🚀</p>
            <a href="/docs" class="btn">Vào Swagger xem API &rarr;</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


# =========================================================================
# LOGIC XỬ LÝ SẢN PHẨM & ENDPOINT CỦA DEMI MART (MULTI-MODEL SUPPORT)
# =========================================================================
class RecommendRequest(BaseModel):
    message: str
    products_data: List[Dict]
    model: Optional[str] = None  # Thêm field model (không bắt buộc, nếu không truyền sẽ dùng default)

def get_embedding_local(text: str) -> List[float]:
    cleaned = text.lower().strip()
    words = cleaned.split()
    vector = np.zeros(128)
    for i, word in enumerate(words):
        idx = sum(ord(c) for c in word) % 128
        vector[idx] += 1.0 + (i * 0.1)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector.tolist()

def text_match_score(query: str, product_text: str) -> float:
    query_words = query.lower().split()
    product_text_lower = product_text.lower()
    matches = sum(1 for word in query_words if word in product_text_lower)
    return matches / max(len(query_words), 1)

def run_hybrid_rag_clean(user_query: str, products: List[Dict], target_model: str) -> str:
    """Bộ tìm kiếm Lai kết hợp Dynamic Model Selection"""
    scored_products = []
    query_vector = get_embedding_local(user_query)

    for p in products:
        content = (
            f"Tên: {p.get('name', '')}. "
            f"Danh mục: {p.get('category', '')}. "
            f"Giá: {p.get('price', 0):,} VNĐ. "
            f"Mô tả: {p.get('description', '')}. "
            f"Kho: {'Còn hàng' if p.get('stock', 0) > 0 else 'Hết hàng'}."
        )
        
        prod_vector = get_embedding_local(content)
        semantic_score = np.dot(query_vector, prod_vector)
        keyword_score = text_match_score(user_query, content)
        
        final_score = (0.3 * keyword_score) + (0.7 * semantic_score)
        scored_products.append((final_score, content))

    scored_products.sort(key=lambda x: x[0], reverse=True)
    top_products = scored_products[:3]
    context_str = "\n---\n".join([item[1] for item in top_products])

    system_prompt = (
        "Bạn là chuyên gia ẩm thực kiêm trợ lý bán hàng AI của siêu thị Demi Mart.\n\n"
        "QUY TẮC PHÂN CHIA NGỮ CẢNH PHẢN HỒI:\n"
        "1. Trường hợp Khách hỏi mua sắm / tìm sản phẩm thông thường (Ví dụ: 'có mì tôm không', 'bên mình có nước ngọt không',...):\n"
        "   - Bạn CHỈ trả lời ngắn gọn, lịch sự, xác nhận tình trạng hàng hóa hiện có trong kho.\n"
        "   - KHÔNG viết hoa các đề mục lớn, KHÔNG tạo danh sách các bước nấu ăn.\n\n"
        "2. Trường hợp Khách hỏi về công thức món ăn, cách chế biến, thành phần hoặc những gì bên trong món (Ví dụ: 'cách làm bánh mì', 'lẩu thái cần những gì', 'muốn nấu mì ngon',...):\n"
        "   - Bạn BẮT BUỘC triển khai câu trả lời theo đúng cấu trúc tiêu chuẩn để hiển thị lên Giao diện Modal:\n"
        "     + Tiêu đề phân đoạn lớn bắt đầu bằng cụm từ chính xác: 'Nguyên liệu có sẵn' hoặc 'Cách làm' hoặc 'Bước 1', 'Bước 2'...\n"
        "     + Liệt kê danh sách các bước thực hiện bằng định dạng số đầu dòng: 1., 2., 3.\n"
        "     + Liệt kê thành phần phụ bằng dấu gạch đầu dòng (-) hoặc dấu (*).\n\n"
        "QUY TẮC ĐÍNH KÈM THẺ SẢN PHẨM (ÁP DỤNG CHO CẢ 2 TRƯỜNG HỢP):\n"
        "Ở cuối câu trả lời của bạn, phải đính kèm chính xác mã ID sản phẩm được nhắc đến để tư vấn theo định dạng: [RECOMMEND: id1, id2]. Nếu không có sản phẩm nào khớp, hãy ghi [RECOMMEND: NONE].\n\n"
        "DANH SÁCH SẢN PHẨM TRONG KHO CỦA SHOP:\n"
        f"{context_str}"
    )

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": target_model,  # Sử dụng model động do Frontend/Gateway truyền xuống
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "temperature": 0.1
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"Lỗi gọi API Router: {response.text}")
        
        result_json = response.json()
        return result_json["choices"][0]["message"]["content"]

@app.post("/ai/recommend")
async def ai_recommend_endpoint(request: RecommendRequest):
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Tin nhắn trống")
        if not request.products_data:
            return {"reply": "Hiện tại hệ thống cửa hàng Demi Mart đang cập nhật danh mục, bạn vui lòng quay lại sau nhé!"}
            
        # Xác định mô hình đích: Ưu tiên mô hình từ request, nếu trống sẽ lấy mặc định ở file .env
        chosen_model = request.model if request.model else DEFAULT_LLM_MODEL
        
        reply = run_hybrid_rag_clean(
            user_query=request.message, 
            products=request.products_data, 
            target_model=chosen_model
        )
        return {"reply": reply}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================================
# TỰ ĐỘNG ĐO ĐẠC CỔNG MẠNG: CHẠY SONG SONG LOCAL (8000) & CLOUD (RENDER)
# =========================================================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)