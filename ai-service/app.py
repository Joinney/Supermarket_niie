import os
import re
import time
from typing import List, Dict, Optional
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import asyncio
import math
from collections import Counter

# Nạp toàn bộ biến môi trường từ file .env vào os.environ
load_dotenv()

app = FastAPI(title="AI Demi Mart Recommendation Service")

# Cấu hình CORS chống bị chặn kết nối liên cổng từ Node.js Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ĐỌC VÀ KIỂM TRA BIẾN MÔI TRƯỜNG
API_KEY = os.getenv("DEEPSEEK_API_KEY") or os.getenv("AI_GATEWAY_KEY")
BASE_URL = os.getenv("DEEPSEEK_BASE_URL") or os.getenv("AI_GATEWAY_URL", "https://api.iamhc.cn/v1")
DEFAULT_LLM_MODEL = os.getenv("DEEPSEEK_MODEL", "DeepSeek-V4-Flash")

print("=========================================================================")
print("🔍 SYSTEM CHECK: KIỂM TRA BIẾN MÔI TRƯỜNG AI SERVICE")
print(f"🔗 BASE URL hiện tại: {BASE_URL}")
print(f"🤖 MODEL đang sử dụng: {DEFAULT_LLM_MODEL}")
if API_KEY:
    masked_key = f"{API_KEY[:6]}...{API_KEY[-6:]}" if len(API_KEY) > 12 else "KEY_TOO_SHORT"
    print(f"✅ DEEPSEEK_API_KEY: Đã nạp thành công! [{masked_key}]")
else:
    print("❌ DEEPSEEK_API_KEY: Chưa được cấu hình! Vui lòng kiểm tra lại file .env")
print("=========================================================================")

if not API_KEY:
    raise RuntimeError("❌ LỖI KHỞI ĐỘNG: Chưa cấu hình DEEPSEEK_API_KEY hoặc AI_GATEWAY_KEY trong file .env!")

KNOWLEDGE_BASE_FILE = "knowledge_base.json"

COOKPAD_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://cookpad.com/vn",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-In-Requests": "1"
}

@app.get("/", response_class=HTMLResponse)
async def home_page():
    html_content = """
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Demi Mart AI Service</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .card { background: white; padding: 3rem; border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03); text-align: center; max-width: 600px; width: 90%; }
            h1 { color: #046A38; font-size: 2.5rem; margin-bottom: 0.5rem; }
            p { color: #64748b; font-size: 1.2rem; margin-bottom: 2rem; }
            .btn { display: inline-block; background-color: #046A38; color: white; text-decoration: none; padding: 12px 32px; border-radius: 50px; }
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

def get_clean_words(text: str) -> set:
    ignore_words = {"cách", "làm", "nấu", "món", "của", "cho", "các", "và", "những"}
    cleaned = text.lower().strip()
    words = re.findall(r'\b\w+\b', cleaned)
    return set(w for w in words if w not in ignore_words and len(w) > 1)

# Nâng cấp thuật toán chấm điểm bằng Jaccard Similarity kết hợp Keyword Match
def compute_hybrid_score(query: str, document: str) -> float:
    query_words = get_clean_words(query)
    doc_words = get_clean_words(document)
    
    if not query_words or not doc_words:
        return 0.0

    # 1. Điểm Jaccard (Độ giao thoa tập hợp)
    intersection = query_words.intersection(doc_words)
    union = query_words.union(doc_words)
    jaccard_score = len(intersection) / len(union) if union else 0.0
    
    # 2. Điểm Keyword Match (Tỉ lệ từ khóa của Query xuất hiện trong Document)
    keyword_score = len(intersection) / len(query_words)
    
    # Kết hợp điểm (ưu tiên Keyword Match hơn)
    final_score = (0.7 * keyword_score) + (0.3 * jaccard_score)
    return final_score

def text_match_score(query: str, product_text: str) -> float:
    query_words = query.lower().split()
    product_text_lower = product_text.lower()
    matches = sum(1 for word in query_words if word in product_text_lower)
    return matches / max(len(query_words), 1)

# Hàm bóc tách từ khóa lõi của món ăn để phục vụ cào tự động ngầm
def extract_dish_keyword(message: str) -> str:
    clean = message.lower()
    clean = re.sub(r'^(cách\s+làm|cách\s+nấu|cách|làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|tìm\s+hiểu\s+về|hướng\s+dẫn\s+nấu)+', '', clean).strip()
    clean = re.sub(r'(cần|những|gì|vậy|shop|như\s+thế\s+nào|ngon|đơn\s+giản)$', '', clean).strip()
    return clean

# HÀM CÀO DỮ LIỆU NỘI BỘ (Tối ưu hóa thời gian chờ Realtime xuống còn 2-3 giây)
async def execute_crawl_internal(keyword: str, pages: int = 1) -> int:
    links = []
    search_url = "https://cookpad.com/vn/tim-kiem/"
    
    async with httpx.AsyncClient(headers=COOKPAD_HEADERS, timeout=15.0, follow_redirects=True) as client:
        try:
            res = await client.get(search_url, params={"q": keyword, "page": 1})
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                for tag in soup.find_all('a', href=True):
                    href = tag.get('href')
                    if '/vn/cong-thuc/' in href or '/cong-thuc/' in href:
                        full_url = href if href.startswith('http') else f"https://cookpad.com{href}"
                        clean_url = full_url.split('?')[0]
                        if clean_url not in links:
                            links.append(clean_url)
        except Exception as e:
            print(f"❌ Lỗi quét danh mục tự động: {str(e)}")

        new_recipes = []
        # Chỉ cào tối đa 2 link chất lượng nhất khi chạy tự động để giảm thời gian user phải chờ đợi phản hồi chat
        for url in links[:2]:
            try:
                res = await client.get(url)
                if res.status_code != 200:
                    continue
                soup = BeautifulSoup(res.text, 'html.parser')
                title_tag = soup.find('h1') or soup.find(attrs={"itemprop": "name"}) or soup.find('h2')
                title = title_tag.text.strip() if title_tag else ""

                img_url = ""
                main_img = soup.find('picture')
                if main_img and main_img.find('img'):
                    img_url = main_img.find('img').get('src', '')
                elif soup.find('img', class_=re.compile(r'photo', re.I)):
                    img_url = soup.find('img', class_=re.compile(r'photo', re.I)).get('src', '')
                
                ingredients = []
                ing_tags = soup.find_all(attrs={"itemprop": "recipeIngredient"}) or soup.find_all(class_=re.compile(r'ingredient', re.I))
                for b in ing_tags:
                    txt = re.sub(r'\s+', ' ', b.text.strip()).replace('▢', '').strip()
                    if txt and txt not in ingredients and len(txt) > 1:
                        ingredients.append(txt)
                
                steps = []
                if img_url and img_url.startswith('http'):
                    steps.append(f"[IMAGE]{img_url}")
                step_tags = soup.find_all(attrs={"itemprop": "recipeInstructions"}) or soup.find_all('li', class_=re.compile(r'step', re.I))
                for i, p in enumerate(step_tags, 1):
                    p_text = p.find('p').text.strip() if p.find('p') else p.text.strip()
                    p_text = re.sub(r'\s+', ' ', p_text)
                    p_text = re.sub(r'^\d+\.?\s*', '', p_text)
                    if p_text and len(p_text) > 4:
                        steps.append(f"{i}. {p_text}")
                
                if title and steps:
                    new_recipes.append({"title": title, "ingredients": ingredients, "steps": steps})
                await asyncio.sleep(0.3) 
            except Exception:
                continue

        if not new_recipes:
            return 0

        current_data = []
        if os.path.exists(KNOWLEDGE_BASE_FILE):
            try:
                with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
                    current_data = json.load(f)
            except Exception:
                current_data = []

        existing_titles = {r.get("title").lower().strip() for r in current_data if r.get("title")}
        added_count = 0
        for nr in new_recipes:
            if nr["title"].lower().strip() not in existing_titles:
                current_data.append(nr)
                added_count += 1

        with open(KNOWLEDGE_BASE_FILE, "w", encoding="utf-8") as f:
            json.dump(current_data, f, ensure_ascii=False, indent=4)
        
        return added_count

class RecommendRequest(BaseModel):
    message: str
    products_data: List[Dict]
    model: Optional[str] = None

def run_hybrid_rag_clean(user_query: str, products: List[Dict], target_model: str) -> str:
    best_recipe_content = ""
    
    if os.path.exists(KNOWLEDGE_BASE_FILE):
        try:
            with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
                learned_recipes = json.load(f)
            
            scored_recipes = []
            
            for recipe in learned_recipes:
                recipe_text = (
                    f"Tên món ăn: {recipe.get('title', '')}. "
                    f"Nguyên liệu: {', '.join(recipe.get('ingredients', []))}. "
                    f"Các bước nấu: {' '.join(recipe.get('steps', []))}"
                )
                
                final_recipe_score = compute_hybrid_score(user_query, recipe_text)
                scored_recipes.append((final_recipe_score, recipe))
            
            if scored_recipes:
                scored_recipes.sort(key=lambda x: x[0], reverse=True)
                highest_recipe_score, top_recipe = scored_recipes[0]
                
                if highest_recipe_score > 0.1:
                    best_recipe_content = (
                        f"MÓN ĂN ĐƯỢC TRÍCH XUẤT TỪ CƠ SỞ TRI THỨC COOKPAD (Độ khớp: {highest_recipe_score:.2f}):\n"
                        f"- Tên món: {top_recipe.get('title')}\n"
                        f"- Nguyên liệu chuẩn: {', '.join(top_recipe.get('ingredients', []))}\n"
                        f"- Hướng dẫn thực hiện thực tế:\n" + "\n".join(top_recipe.get('steps', []))
                    )
                    print(f"🎯 RAG Engine nhặt được món ăn phù hợp nhất: {top_recipe.get('title')} ({highest_recipe_score:.2f})")
        except Exception as e:
            print(f"⚠️ Không đọc được file tri thức món ăn: {str(e)}")

    scored_products = []

    for p in products:
        try:
            raw_price = p.get('price', 0)
            price_val = int(raw_price) if raw_price is not None else 0
        except (ValueError, TypeError):
            price_val = 0

        content = (
            f"Mã ID: {p.get('id', '')}. "
            f"Tên: {p.get('name', '')}. "
            f"Giá: {price_val:,} VNĐ. "  
            f"Chi tiết & Quy cách đóng gói: {p.get('description', '')}. "
            f"Tồn kho thực tế: {p.get('stock', 0)}."
        )
        
        hybrid_score = compute_hybrid_score(user_query, content)
        keyword_score = text_match_score(user_query, content)
        
        final_score = (0.3 * keyword_score) + (0.7 * hybrid_score)
        scored_products.append((final_score, content))

    scored_products.sort(key=lambda x: x[0], reverse=True)
    top_products = scored_products[:20]
    context_str = "\n---\n".join([item[1] for item in top_products])

    system_prompt = (
        "Bạn là chuyên gia ẩm thực kiêm trợ lý bán hàng AI xuất sắc của siêu thị Demi Mart.\n\n"
        "QUY TẮC PHÂN CHIA NGỮ CẢNH PHẢN HỒI:\n"
        "1. Trường hợp Khách hỏi mua sắm / tìm sản phẩm thông thường:\n"
        "   - Bạn CHỈ trả lời ngắn gọn, lịch sự, xác nhận tình trạng hàng hóa hiện có trong kho.\n\n"
        "2. Trường hợp Khách hỏi về công thức món ăn, cách chế biến:\n"
        "   - BẮT BUỘC triển khai câu trả lời theo đúng cấu trúc tiêu chuẩn: 'Nguyên liệu có sẵn:' và 'Cách làm:'\n"
        "   - LƯU Ý TỐI QUAN TRỌNG VỀ NGUYÊN LIỆU: Ở mục 'Nguyên liệu có sẵn:', bạn CHỈ ĐƯỢC PHÉP liệt kê các sản phẩm thực sự khớp và liên quan trực tiếp đến món ăn từ 'DANH SÁCH SẢN PHẨM TRONG KHO'. \n"
        "   - CÂN ĐỐI SỐ LƯỢNG & QUY CÁCH: Chú ý phần 'Chi tiết & Quy cách đóng gói' (VD: hộp 10 quả, lốc 6 lon, gói 500g). Chỉ lấy đúng lượng nguyên liệu vừa đủ cho công thức, tuyệt đối không lấy dư thừa lãng phí hay thiếu hụt vô lý.\n"
        "   - BÁN CHÉO (CROSS-SELLING) THÔNG MINH: Để bữa ăn thêm trọn vẹn, hãy luôn chủ động phân tích 'DANH SÁCH SẢN PHẨM TRONG KHO' và tìm ra 1-2 món ăn kèm, thức uống (nước ngọt có gas, trà, nước ép...) phù hợp với món ăn chính để gợi ý thêm.\n"
        "   - TUYỆT ĐỐI KHÔNG liệt kê bừa bãi các sản phẩm không liên quan. Nếu KHÔNG CÓ sản phẩm nào khớp, hãy ghi: 'Hiện tại siêu thị chưa có sẵn nguyên liệu cho món này.' và xuất mã [RECOMMEND: NONE].\n\n"
        "QUY TẮC ĐÍNH KÈM THẺ SẢN PHẨM:\n"
        "Ở cuối câu trả lời của bạn, phải đính kèm chính xác Mã ID sản phẩm được nhắc đến theo định dạng: [RECOMMEND: id1, id2]. Nếu không có, ghi [RECOMMEND: NONE].\n\n"
        "=========================================\n"
        f"{best_recipe_content}\n"
        "=========================================\n"
        "DANH SÁCH SẢN PHẨM TRONG KHO CỦA SIÊU THỊ:\n"
        f"{context_str}"
    )

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    clean_base_url = BASE_URL.replace("/chat/completions", "").rstrip("/")
    api_endpoint = f"{clean_base_url}/chat/completions"

    payload = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "temperature": 0.15
    }

    with httpx.Client(timeout=25.0) as client:
        response = client.post(api_endpoint, headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"Lỗi gọi API Router: {response.text}")
        return response.json()["choices"][0]["message"]["content"]

def run_local_rule_fallback(user_query: str, products: List[Dict]) -> str:
    # 1. Quét tìm công thức trực tiếp trong knowledge_base.json (Không cần gọi LLM)
    best_recipe = None
    if os.path.exists(KNOWLEDGE_BASE_FILE):
        try:
            with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
                learned_recipes = json.load(f)
            
            scored_recipes = []
            
            for recipe in learned_recipes:
                recipe_text = f"{recipe.get('title', '')} {' '.join(recipe.get('ingredients', []))}"
                final_recipe_score = compute_hybrid_score(user_query, recipe_text)
                scored_recipes.append((final_recipe_score, recipe))
            
            if scored_recipes:
                scored_recipes.sort(key=lambda x: x[0], reverse=True)
                highest_score, best_recipe = scored_recipes[0]
                
                # 🌟 SỬA Ở ĐÂY: Bóc tách từ khóa và siết chặt điểm số
                dish_kw = extract_dish_keyword(user_query)
                
                # Nếu điểm quá thấp HOẶC từ khóa món ăn không hề có trong tiêu đề công thức -> Hủy bỏ
                if highest_score < 0.4 and (dish_kw not in best_recipe.get('title', '').lower()):
                    best_recipe = None
        except Exception as e:
            print(f"Lỗi đọc JSON trong Fallback: {e}")

    # 2. Lấy danh sách SẢN PHẨM (tên + ID) dựa trên từ khóa
    query_lower = user_query.lower()
    matched_products = []
    
    # Lọc bỏ các từ vô nghĩa để tìm kiếm chuẩn xác hơn
    ignore_words = {"cách", "làm", "nấu", "món", "bên", "mình", "ngon", "lẩu", "thái", "tìm", "mua", "những", "nguyên", "liệu", "cho", "các", "của"}
    keywords = [w for w in query_lower.split() if len(w) > 2 and w not in ignore_words]
    
    for p in products:
        p_name = str(p.get("name", "")).lower()
        if keywords and any(k in p_name for k in keywords):
            if p.get("id") and p not in matched_products:
                matched_products.append(p)

    matched_ids = [str(p.get("id")) for p in matched_products]
    recommend_tag = f"[RECOMMEND: {', '.join(matched_ids)}]" if matched_ids else "[RECOMMEND: NONE]"
    
    is_recipe = bool(re.search(r"(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|nguyên\s+liệu)", query_lower))

    # 3. Định dạng lại văn bản phản hồi
    if is_recipe and best_recipe:
        # Lấy sạch sẽ các bước hướng dẫn từ Cookpad
        step_str = "\n".join([f"{step}" for step in best_recipe.get("steps", [])])
        
        # 🌟 ĐIỂM QUAN TRỌNG: Không dùng nguyên liệu rác của Cookpad nữa!
        # Dùng trực tiếp tên sản phẩm của siêu thị Demi Mart để in ra danh sách bên trái
        if matched_products:
            ing_str = "\n".join([f"- {p.get('name', '')}" for p in matched_products])
        else:
            ing_str = "- Các gói nguyên liệu đi kèm hiện có sẵn tại siêu thị, bạn có thể kiểm tra trực tiếp qua công cụ tìm kiếm."
        
        fallback_text = (
            f"Nguyên liệu có sẵn:\n{ing_str}\n\n"
            f"Cách làm:\n{step_str}\n\n"
            f"{recommend_tag}"
        )
    elif is_recipe:
        # Nếu kho không có gì và cũng chưa cào kịp Cookpad
        fallback_text = (
            "Nguyên liệu có sẵn:\n"
            "- Các gói nguyên liệu đi kèm hiện có sẵn tại siêu thị, bạn có thể kiểm tra trực tiếp qua công cụ tìm kiếm.\n\n"
            "Cách làm:\n"
            "1. Sơ chế sạch nguyên liệu tươi sống.\n"
            "2. Thực hiện nấu chín và điều chỉnh gia vị vừa ăn phù hợp khẩu vị cá nhân.\n\n"
            f"{recommend_tag}"
        )
    else:
        # Chat thông thường
        fallback_text = (
            "Chào bạn! Demi Mart hiện đang có sẵn một số mặt hàng thuộc nhóm sản phẩm bạn đang tìm kiếm ở danh sách bên dưới. "
            f"Bạn xem qua xem có đúng loại mình cần không nhé! 😊\n\n{recommend_tag}"
        )
        
    return fallback_text

@app.post("/ai/recommend")
async def ai_recommend_endpoint(request: RecommendRequest):
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Tin nhắn trống")
        if not request.products_data:
            return {"reply": "Hiện tại hệ thống cửa hàng Demi Mart đang cập nhật danh mục, bạn vui lòng quay lại sau nhé!"}
            
        chosen_model = request.model if request.model else DEFAULT_LLM_MODEL
        
        # Tự động cào dữ liệu Cookpad
        is_recipe = bool(re.search(r"(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|nguyên\s+liệu)", request.message.lower()))
        if is_recipe:
            dish_keyword = extract_dish_keyword(request.message)
            if len(dish_keyword) > 2:
                has_recipe = False
                if os.path.exists(KNOWLEDGE_BASE_FILE):
                    try:
                        with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
                            kb_data = json.load(f)
                        has_recipe = any(dish_keyword in r.get("title", "").lower() for r in kb_data)
                    except Exception:
                        has_recipe = False
                
                if not has_recipe:
                    print(f"🚀 [Auto-Crawl]: Không tìm thấy món '{dish_keyword}' trong tri thức cục bộ. Kích hoạt cào Cookpad Realtime...")
                    await execute_crawl_internal(keyword=dish_keyword, pages=1)

        # 🔥 BỎ TRY-EXCEPT, ÉP VĂNG LỖI ĐỂ NODEJS THẤY MÃ 500 VÀ ĐỔI MODEL
        reply = run_hybrid_rag_clean(
            user_query=request.message, 
            products=request.products_data, 
            target_model=chosen_model
        )
        
        return {"reply": reply}
        
    except Exception as e:
        # Khi LLM hỏng, trả mã 500 cho Node.js bắt
        raise HTTPException(status_code=500, detail=str(e))

# 🌟 ENDPOINT DỰ PHÒNG CHUYÊN DỤNG CHO NODEJS
@app.post("/ai/fallback")
async def ai_fallback_endpoint(request: RecommendRequest):
    reply = run_local_rule_fallback(user_query=request.message, products=request.products_data)
    return {"reply": reply}

@app.get("/ai/crawl-knowledge")
async def trigger_crawl_knowledge(keyword: str = "lẩu thái", pages: int = 1):
    added = await execute_crawl_internal(keyword=keyword, pages=pages)
    total_pool = 0
    if os.path.exists(KNOWLEDGE_BASE_FILE):
        with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
            total_pool = len(json.load(f))
            
    return {
        "success": True,
        "message": f"Tiến trình học tập hoàn tất. Đã nạp thêm {added} món ăn mới về từ khóa '{keyword}' vào cơ sở tri thức!",
        "total_knowledge_pool": total_pool
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)