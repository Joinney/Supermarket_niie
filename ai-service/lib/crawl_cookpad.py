import httpx
from bs4 import BeautifulSoup
import json
import time
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
}

def get_recipe_links(search_keyword: str, max_pages: int = 2):
    """
    Hàm lấy danh sách các đường dẫn (URL) món ăn dựa theo từ khóa tìm kiếm trên Cookpad
    """
    links = []
    # Cookpad sử dụng query ?q=từ-khóa để tìm kiếm
    base_search_url = "https://cookpad.com/vn/tim-kiem/"
    
    with httpx.Client(headers=HEADERS, timeout=10.0) as client:
        for page in range(1, max_pages + 1):
            try:
                print(f"🕵️ đang quét danh sách món ăn từ khóa '{search_keyword}' - Trang {page}...")
                params = {"q": search_keyword, "page": page}
                response = client.get(base_search_url, params=params)
                
                if response.status_code != 200:
                    continue
                    
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Cookpad bọc các block bài viết trong thẻ li hoặc div có thuộc tính data-recipe-id
                for link_tag in soup.find_all('a', href=re.compile(r'/vn/cong-thuc/')):
                    href = link_tag.get('href')
                    full_url = f"https://cookpad.com{href}" if href.startswith('/') else href
                    if full_url not in links:
                        links.append(full_url)
                        
                time.sleep(1) # Nghỉ 1 giây tránh bị chặn IP
            except Exception as e:
                print(f"❌ Lỗi khi quét danh sách trang {page}: {str(e)}")
                
    return links

def extract_recipe_detail(recipe_url: str):
    """
    Hàm truy cập trực tiếp vào một bài viết cụ thể để bóc tách: Tên, Nguyên liệu, Cách làm
    """
    with httpx.Client(headers=HEADERS, timeout=10.0) as client:
        try:
            response = client.get(recipe_url)
            if response.status_code != 200:
                return None
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 1. Bóc tách tên món ăn
            title_tag = soup.find('h1') or soup.find('h1', class_=re.compile(r'recipe'))
            title = title_tag.text.strip() if title_tag else "Món ăn chưa đặt tên"
            
            # 2. Bóc tách danh sách nguyên liệu
            ingredients = []
            # Cấu trúc Cookpad thường bọc nguyên liệu trong các div/li chứa thuộc tính d-flex hoặc ingredient
            ingredient_blocks = soup.find_all(attrs={"itemprop": "recipeIngredient"}) or soup.find_all('div', class_=re.compile(r'ingredient'))
            for block in ingredient_blocks:
                text = block.text.strip()
                # Làm sạch khoảng trắng thừa bên trong text
                text = re.sub(r'\s+', ' ', text)
                if text and text not in ingredients:
                    ingredients.append(text)
            
            # 3. Bóc tách các bước làm
            steps = []
            step_blocks = soup.find_all(attrs={"itemprop": "recipeInstructions"}) or soup.find_all('div', class_=re.compile(r'step'))
            for index, block in enumerate(step_blocks, 1):
                # Thường Cookpad bọc đoạn chữ của từng bước trong thẻ p hoặc div description
                p_tag = block.find('p') or block
                step_text = p_tag.text.strip()
                if step_text:
                    steps.append(f"{index}. {step_text}")
                    
            # Đóng gói dữ liệu chuẩn RAG Dataset
            return {
                "url": recipe_url,
                "title": title,
                "ingredients": ingredients,
                "steps": steps
            }
        except Exception as e:
            print(f"❌ Lỗi khi bóc tách URL {recipe_url}: {str(error)}")
            return None

if __name__ == "__main__":
    # Tiến hành chạy thử nghiệm cào dữ liệu món "bánh mì"
    keyword = "bánh mì"
    recipe_urls = get_recipe_links(search_keyword=keyword, max_pages=1)
    print(f"🎯 Tìm thấy {len(recipe_urls)} đường dẫn món ăn liên quan.")
    
    dataset = []
    for url in recipe_urls[:5]: # Thử nghiệm cào trước 5 món để kiểm tra cấu trúc
        print(f"🚀 Đang bóc tách chi tiết: {url}")
        recipe_info = extract_recipe_detail(url)
        if recipe_info and recipe_info["steps"]: # Chỉ lấy những bài có cấu trúc bước làm đầy đủ
            dataset.append(recipe_info)
        time.sleep(1.5) # Giãn cách thời gian an toàn
        
    # Xuất dữ liệu ra file JSON sạch để nạp vào AI
    with open("cookpad_recipes.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=4)
        
    print("✨ Hoàn tất tiến trình! Đã lưu dữ liệu thu hoạch vào file 'cookpad_recipes.json'")