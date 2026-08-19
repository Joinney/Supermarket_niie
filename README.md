# Supermarket - Hệ Thống Thương Mại Điện Tử Demi Mart

[![Demi Mart Banner](./Screenshot/demimart.png)](https://github.com/Joinney/Supermarket_niie/blob/main/Screenshot/demimart.png)

> Hệ thống quản lý và bán hàng siêu thị trực tuyến toàn diện bao gồm **Web App (Next.js 14 / TypeScript)**, **Mobile App (React Native)**, **AI Service Chatbot**, và hệ thống **Backend Node.js Microservices** được triển khai bằng **Docker & NGINX**.

---

## 🔗 Link Demo & Tài Liệu
* **Website Demo:** [https://demimart-fe.onrender.com](https://demimart-fe.onrender.com)
* **API Documentation:** `https://api-gateway-vuyo.onrender.com` (Swagger / Postman)

---

## 🛠 Công Nghệ Sử Dụng

### Frontend & Mobile
* **Web App (`frontend-web`):** Next.js 14, ReactJS, TypeScript, Tailwind CSS
* **Mobile App (`mobile-dev`):** React Native (Expo/CLI), AuthContext, State Management

### Backend & AI Service
* **Backend (`backend-node/services`):** Node.js, Express.js, JavaScript, Go, Java, Python
* **AI Service (`ai-service`):** Python (Chatbot AI hỗ trợ tư vấn sản phẩm, gợi ý thuộc tính, tự động thêm vào giỏ hàng)
* **Web Server & Reverse Proxy (`nginx`):** NGINX, Docker Compose

### DevOps & CI/CD
* **Containerization:** Docker, Docker Compose (`docker-configs`)
* **CI/CD Pipeline:** GitLab CI (`.gitlab-ci.yml`)

---

## 📸 Giao Diện Hệ Thống

| Web Desktop | Mobile App |
| :---: | :---: |
| ![Web Desktop](./Screenshot/desktop.png) | ![Mobile App](./Screenshot/mobile.png) |

---

## 🔑 Phân Quyền Hệ Thống (Roles & Permissions)

* **Khách hàng (Customer / User):**
  * Xem danh mục, tìm kiếm và lọc sản phẩm.
  * Tương tác với Chatbot AI để tư vấn thuộc tính sản phẩm và thêm nhanh vào giỏ hàng.
  * Quản lý giỏ hàng, đặt hàng và theo dõi đơn hàng qua Web/Mobile.
  * Đăng nhập / Đăng ký tài khoản (hỗ trợ lưu phiên đăng nhập bảo mật).

* **Quản trị viên (Admin):**
  * Truy cập Dashboard quản lý toàn hệ thống.
  * Quản lý sản phẩm, danh mục, số lượng tồn kho (đồng bộ giữa Web & Mobile).
  * Quản lý đơn hàng, người dùng và phân tích dữ liệu bán hàng.

---

## 📂 Cấu Trúc Dự Án

```text
Supermarket_niie/
├── Screenshot/             # Hình ảnh giao diện demo
├── ai-service/             # Dịch vụ AI Chatbot & Recommendation
├── backend-node/services/  # API Backend Node.js microservices
├── docker-configs/         # Cấu hình môi trường Docker
├── frontend-web/           # Giao diện Web (Next.js 14)
├── mobile-dev/             # Ứng dụng di động (React Native)
├── nginx/                  # NGINX reverse proxy setup
├── .gitlab-ci.yml          # Cấu hình triển khai tự động CI/CD
└── docker-compose.yml      # Khởi chạy toàn bộ hệ thống bằng 1 lệnh
