import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext"; 
import { CartProvider } from "./context/CartContext"; 
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Profile from "./pages/Profile/Profile";
import ProductDetail from "./pages/Productdetail/ProductDetail";
import Cart from "./pages/Giohang/Cart";

/**
 * 1. MAIN LAYOUT
 */
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onOpenMenu={() => setIsSidebarOpen(true)} />
      
      <div className="flex flex-1 pt-[112px] w-full relative bg-white"> 
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <div className="flex-1 flex flex-col min-w-0 border-l border-gray-100 bg-white"> 
          <main className="flex-1 overflow-x-hidden bg-white">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

/**
 * 2. AUTH LAYOUT
 */
const AuthLayout = () => (
  <div className="min-h-screen w-full bg-white flex items-center justify-center">
    <Outlet />
  </div>
);

/**
 * 3. APP ROUTES
 */
const AppRoutes = () => {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          
          <Route 
            path="/:country_code/product/:category_slug/:id/:variantId?" 
            element={<ProductDetail />} 
          />
          
          <Route path="/cart" element={<Cart />} />
          
          {/* --- SỬA DÒNG NÀY --- */}
          {/* Thêm /:tab? vào sau /profile để khớp với /profile/address, /profile/orders... */}
          <Route path="/profile/:tab?" element={<Profile />} />

        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Routes>
    </Router>
  );
};
/**
 * 4. FINAL APP
 */
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;