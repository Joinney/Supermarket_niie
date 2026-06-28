import React from "react";
import { Package } from "lucide-react";

export default function Tabvoucher() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-300">
      <Package size={40}/>
      <p className="text-sm font-bold uppercase tracking-widest text-center">Module cho danh mục vouchers đang được nâng cấp</p>
    </div>
  );
}