import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { login, user } = useContext(AuthContext);
    const { mergeCart } = useCart();
    const navigate = useNavigate();

    const stats = [
        { value: "15k+", label: "Happy Clients" },
        { value: "30m", label: "Fast Delivery" },
    ];

    // Nếu đã có user hợp lệ nằm vững trong hệ thống thì điều hướng về Home
    useEffect(() => {
        if (user) {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    // 🎯 CẬP NHẬT: Xử lý đăng nhập, dọn dẹp chéo Admin & gộp giỏ hàng
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // 1. LỘT BỎ TÀN DƯ ADMIN (Tránh xung đột Axios Interceptors sau này)
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("adminInfo");

        try {
            const result = await login(username, password);

            if (result && result.success) {
                console.log("🚀 Login thành công! Tiến hành đồng bộ dữ liệu...");

                // 2. GỘP GIỎ HÀNG (Guest Cart -> Member Cart)
                if (typeof mergeCart === "function") {
                    try {
                        await mergeCart();
                        console.log("🛒 Đã gộp giỏ hàng Local vào Database thành công!");
                    } catch (cartErr) {
                        console.error("Lỗi đồng bộ giỏ hàng:", cartErr);
                    }
                }

                // 3. ĐIỀU HƯỚNG VỀ TRANG CHỦ MƯỢT MÀ
                navigate("/", { replace: true });
            } else {
                setError(result?.message || "Email hoặc mật khẩu không đúng");
                setLoading(false);
            }
        } catch (err) {
            console.error("Login logic error:", err);
            setError("Lỗi kết nối server. Vui lòng thử lại sau.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setLoading(true);

        // Dọn dẹp tàn dư Admin trước khi rẽ nhánh sang OAuth Google
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("adminInfo");

        const apiBaseUrl = import.meta.env.VITE_API_AUTH_URL || "http://localhost:5001";
        setTimeout(() => {
            window.location.href = `${apiBaseUrl}/api/auth/google`;
        }, 500);
    };

    return (
        <div className="fixed inset-0 h-screen w-screen flex bg-white overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif] z-[9999]">
            
            {/* TRÁI: HERO SECTION */}
            <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-16 text-white border-none shrink-0 overflow-hidden sticky top-0 h-screen">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000" 
                        className="w-full h-full object-cover" 
                        alt="Fresh" 
                    />
                    <div className="absolute inset-0 bg-[#006c49]/80 mix-blend-multiply"></div>
                </div>

                <div className="relative z-10 space-y-6 max-w-xl text-left">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#006c49] shadow-xl">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8.13,20C11,20 13.85,18.08 15,15.27C16.15,18.08 19,20 21.87,20C22.36,20 22.86,19.87 23.34,19.7L24.29,22L26.18,21.34C24.1,16.17 22,10 13,8L15,3L13,2L11,7L13,8M8.13,18C7,18 6,17.43 5.4,16.43C5.94,15.05 6.5,13.62 7.07,12.18C8.28,12.04 9.14,12.56 9.61,13.72C10.08,14.89 9.87,16.22 8.13,18M21.87,18C20.13,16.22 19.92,14.89 20.39,13.72C20.86,12.56 21.72,12.04 22.93,12.18C23.5,13.62 24.06,15.05 24.6,16.43C24,17.43 23,18 21.87,18Z"/>
                        </svg>
                    </div>
                    <h1 className="text-5xl xl:text-7xl font-black leading-[1.1] tracking-tighter">
                        Freshness <br /> 
                        <span className="text-white/90">delivered.</span>
                    </h1>
                    <p className="text-sm xl:text-lg opacity-90 leading-relaxed font-medium max-w-md">
                        Join thousands of happy shoppers who choose Demi Mart for their daily premium groceries.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4 w-full max-w-sm">
                    {stats.map((item, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 xl:p-5 rounded-2xl flex-1 text-center">
                            <div className="text-xl xl:text-3xl font-bold">{item.value}</div>
                            <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">{item.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* PHẢI: LOGIN FORM */}
            <section className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 xl:p-20 bg-white min-h-screen relative shrink-0">
                
                <Link 
                    to="/" 
                    className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-[#006c49] transition-all group font-bold text-[10px] uppercase tracking-widest"
                >
                    <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-[#006c49]/10 transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    <span>Home</span>
                </Link>

                <div className="w-full max-w-[400px] xl:max-w-[480px] space-y-8 animate-fadeIn">
                    <header className="space-y-1 text-left">
                        <h2 className="text-3xl xl:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">Welcome back</h2>
                        <p className="text-slate-500 font-medium text-xs xl:text-sm">Sign in to access your fresh groceries</p>
                    </header>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold text-center animate-bounce">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5 relative text-left">
                            <label className="text-[10px] xl:text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email / Username</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#006c49] z-10 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="name@company.com" 
                                    className="demi-input" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 relative text-left">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] xl:text-xs font-bold text-slate-700 uppercase tracking-widest">Password</label>
                                <Link 
                                    to="/forgot-password" 
                                    className="text-[10px] font-bold text-[#006c49] hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#006c49] z-10 transition-colors" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    className="demi-input pr-12" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            disabled={loading} 
                            className="w-full bg-[#006c49] hover:bg-[#004d34] text-white py-3.5 xl:py-4.5 rounded-xl font-black text-sm xl:text-lg shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all uppercase flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>Sign In <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="mx-4 text-[10px] font-bold text-slate-300 tracking-widest uppercase">Or continue with</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-xs"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" /> Google
                        </button>
                        <button className="flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-xs">
                            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-4 h-4" alt="F" /> Facebook
                        </button>
                    </div>

                    <p className="text-center text-xs xl:text-sm text-slate-400 font-medium pt-2">
                        Don't have an account? <Link to="/signup" className="text-[#006c49] font-black hover:underline">Create Account</Link>
                    </p>
                </div>
            </section>

            <style dangerouslySetInnerHTML={{ __html: `
                .demi-input { 
                    width: 100%; 
                    padding-left: 3rem; 
                    padding-right: 1rem; 
                    padding-top: 0.8rem; 
                    padding-bottom: 0.8rem; 
                    background-color: white; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 0.8rem; 
                    outline: none; 
                    transition: all 0.3s; 
                    font-size: 0.875rem; 
                    color: #0f172a;
                }
                .demi-input::placeholder { color: #94a3b8; opacity: 1; }
                .demi-input:focus { 
                    border-color: #006c49; 
                    box-shadow: 0 0 0 4px rgba(0, 108, 73, 0.05); 
                }
                @media (min-width: 1280px) { 
                    .demi-input { 
                        padding-top: 1.1rem; 
                        padding-bottom: 1.1rem; 
                        font-size: 1rem; 
                        padding-left: 3.5rem; 
                        border-radius: 1rem; 
                    } 
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.8s ease-in-out forwards; }
            `}} />
        </div>
    );
}