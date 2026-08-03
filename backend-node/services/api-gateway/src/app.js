import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { services } from './config/services.config.js';

const app = express();

// ==========================================
// 1. DYNAMIC CORS CONFIGURATION
// ==========================================
// Danh sách các origins được phép gọi vào Gateway
const allowedOrigins = [
    'https://demimart-fe.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    process.env.FRONTEND_URL
].filter(Boolean); // Lọc bỏ giá trị undefined/null

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép các request không có origin (như Postman, Mobile app, Server-to-Server)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) {
            return callback(null, true);
        } else {
            // Cho phép tạm thời mọi origin từ render.com để tránh bị block khi đổi subdomain
            if (origin.endsWith('.onrender.com')) {
                return callback(null, true);
            }
            return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Ghi log request để dễ debug
app.use(morgan('dev'));

// ==========================================
// 2. DASHBOARD ROUTE (Tông màu #006c49)
// ==========================================
app.get('/dashboard', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://demimart-fe.onrender.com';
    const totalServices = Object.keys(services).length;

    // Hàng hiển thị cổng Frontend
    const frontendRow = `
        <tr style="background-color: #f0fdf4;">
            <td class="service-name">
                <span class="dot-online"></span>
                <strong>Frontend (UI Web)</strong>
            </td>
            <td><span class="badge port" style="background: #dcfce7; color: #15803d;">${frontendUrl}</span></td>
            <td><span class="badge endpoint">/ (Trang chủ)</span></td>
            <td><span class="badge-status">Active</span></td>
            <td>
                <a href="${frontendUrl}" target="_blank" class="btn-visit">
                    Truy cập ↗
                </a>
            </td>
        </tr>
    `;

    // Danh sách các hàng Microservices
    const serviceRows = Object.entries(services).map(([name, url]) => `
        <tr>
            <td class="service-name">
                <span class="dot-online"></span>
                <strong>${name.charAt(0).toUpperCase() + name.slice(1)} Service</strong>
            </td>
            <td><span class="badge port">${url}</span></td>
            <td><span class="badge endpoint">/api/v1/${name === 'inventory' ? 'inventory' : name}</span></td>
            <td><span class="badge-status">Active</span></td>
            <td>
                <a href="${url}" target="_blank" class="btn-visit">
                    Truy cập ↗
                </a>
            </td>
        </tr>
    `).join('');

    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demi Mart - API Gateway Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #006c49;
                --primary-hover: #005237;
                --primary-light: #e6f3ed;
                --bg-body: #f4f7f6;
                --card-bg: #ffffff;
                --text-main: #1e293b;
                --text-muted: #64748b;
                --border-color: #e2e8f0;
            }

            * { box-sizing: border-box; }
            body { 
                font-family: 'Plus Jakarta Sans', sans-serif; 
                background: var(--bg-body); 
                color: var(--text-main); 
                margin: 0; 
                padding: 2.5rem 1rem; 
            }

            .container { 
                max-width: 1000px; 
                margin: 0 auto; 
                background: var(--card-bg); 
                padding: 2.5rem; 
                border-radius: 16px; 
                box-shadow: 0 10px 25px -5px rgba(0, 108, 73, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01); 
            }

            .header { 
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                padding-bottom: 1.25rem;
                border-bottom: 1px solid var(--border-color);
            }

            .brand { display: flex; align-items: center; gap: 0.75rem; }
            .brand-icon {
                width: 42px;
                height: 42px;
                background: var(--primary-light);
                color: var(--primary);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
            }

            h1 { font-size: 1.35rem; color: var(--text-main); margin: 0; font-weight: 700; }
            
            .status-online { 
                background: var(--primary-light); 
                color: var(--primary); 
                padding: 0.4rem 0.85rem; 
                border-radius: 9999px; 
                font-weight: 600; 
                font-size: 0.825rem; 
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin: 1.5rem 0;
            }

            .metric-card {
                background: #fafafa;
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 1rem 1.25rem;
            }

            .metric-card .title { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
            .metric-card .value { font-size: 1.2rem; color: var(--primary); font-weight: 700; margin-top: 0.25rem; word-break: break-all; }

            .table-wrapper {
                border: 1px solid var(--border-color);
                border-radius: 12px;
                overflow: hidden;
            }

            table { width: 100%; border-collapse: collapse; background: #fff; }
            th, td { text-align: left; padding: 0.95rem 1.25rem; border-bottom: 1px solid var(--border-color); font-size: 0.875rem; }
            tr:last-child td { border-bottom: none; }
            
            th { 
                background-color: var(--primary); 
                color: #ffffff; 
                font-weight: 600; 
                letter-spacing: 0.02em;
            }

            tbody tr { transition: background-color 0.15s ease; }
            tbody tr:hover { background-color: #f8faf9; }

            .service-name { display: flex; align-items: center; gap: 0.6rem; color: var(--text-main); }
            
            .dot-online {
                width: 8px;
                height: 8px;
                background-color: var(--primary);
                border-radius: 50%;
                display: inline-block;
            }

            .badge { 
                padding: 0.3rem 0.65rem; 
                border-radius: 6px; 
                font-family: 'Courier New', Courier, monospace; 
                font-size: 0.825rem; 
            }

            .port { background: var(--primary-light); color: var(--primary); font-weight: 600; }
            .endpoint { background: #f1f5f9; color: #334155; font-weight: 600; }
            
            .badge-status {
                background: #dcfce7;
                color: #15803d;
                padding: 0.25rem 0.6rem;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .btn-visit {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                background-color: var(--primary);
                color: #ffffff;
                text-decoration: none;
                padding: 0.35rem 0.75rem;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                transition: all 0.2s ease;
            }

            .btn-visit:hover {
                background-color: var(--primary-hover);
                box-shadow: 0 2px 6px rgba(0, 108, 73, 0.3);
                transform: translateY(-1px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">
                    <div class="brand-icon">🚀</div>
                    <div>
                        <h1>Demi Mart - API Gateway</h1>
                    </div>
                </div>
                <span class="status-online"><span class="dot-online"></span> Gateway Online</span>
            </div>

            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="title">Cổng Frontend</div>
                    <div class="value">${frontendUrl}</div>
                </div>
                <div class="metric-card">
                    <div class="title">Tổng Microservices</div>
                    <div class="value">${totalServices} Services</div>
                </div>
                <div class="metric-card">
                    <div class="title">Cổng Gateway</div>
                    <div class="value">:${process.env.PORT || 5000}</div>
                </div>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Tên Dịch Vụ</th>
                            <th>Target URL (Nguồn)</th>
                            <th>Tuyến Gateway (Route Prefix)</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${frontendRow}
                        ${serviceRows}
                    </tbody>
                </table>
            </div>
        </div>
    </body>
    </html>
    `);
});

// ==========================================
// 3. PROXY ROUTES REGISTRATION
// ==========================================
// Gắn các route proxy (Tuyệt đối không để express.json() phía trên dòng này)
app.use('/', routes);

export default app;