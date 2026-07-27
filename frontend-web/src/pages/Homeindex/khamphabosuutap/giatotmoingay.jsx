import React from "react";
import ProductCard from "../../../components/Product/ProductCard";

export default function Giatotmoingay({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-slate-50 border border-slate-100 rounded-3xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  // Giá tốt mỗi ngày: Sắp xếp giá từ thấp đến cao
  const displayList = [...products]
    .sort((a, b) => {
      const priceA = Number(a.gia_ban_thap_nhat || a.gia_ban_le || 0);
      const priceB = Number(b.gia_ban_thap_nhat || b.gia_ban_le || 0);
      return priceA - priceB;
    })
    .slice(0, 12);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5 md:gap-6">
      {displayList.map((p, idx) => (
        <div
          key={`goodprice-${p.ma_san_pham || "empty"}-${idx}`}
          className="w-full bg-white rounded-[28px] border border-slate-100/80 p-1 hover:shadow-xl hover:border-slate-200/50 transition-all duration-300 hover:-translate-y-1"
        >
          <ProductCard p={p} />
        </div>
      ))}
    </div>
  );
}