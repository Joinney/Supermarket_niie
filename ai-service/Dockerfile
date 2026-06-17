# 1. Sử dụng Base Image Python chính thức, gọn nhẹ
FROM python:3.10-slim

# 2. Thiết lập thư mục làm việc trong container
WORKDIR /app

# 3. Cài đặt các công cụ build hệ thống cần thiết (tương tự apt-get nâng cao)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Sao chép requirements.txt vào trước để tận dụng cache
COPY requirements.txt .

# 5. ĐÓNG GÓI TOÀN BỘ CHUỖI LỆNH CÀI ĐẶT CỦA DEMI VÀO ĐÂY
# Docker tự cô lập môi trường nên không cần tạo 'venv' nữa, cài trực tiếp luôn nhé!
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir "numpy>=2.0.0" && \
    pip install --no-cache-dir -r requirements.txt

# 6. Sao chép toàn bộ mã nguồn app.py vào container
COPY . .

# 7. Mở cổng mạng nội bộ
EXPOSE 8000

# 8. LỆNH KHỞI CHẠY UVICORN TỰ ĐỘNG (Sửa --host thành 0.0.0.0 để Docker map cổng ra ngoài)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]