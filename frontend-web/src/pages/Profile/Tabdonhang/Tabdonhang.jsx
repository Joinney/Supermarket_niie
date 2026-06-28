import React from "react";
import { ChevronRight } from "lucide-react";

export default function Tabdonhang({ orders }) {
  return (
    <div className="space-y-6 text-left">
      <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Lịch sử giao dịch vận đơn</h2>
      <div className="space-y-4">
         {orders.map(order => (
           <div key={order.id} className="p-4 rounded-3xl bg-white border border-slate-100 flex gap-4 items-center group hover:shadow-md transition-all">
             <img src={order.img} className="w-16 h-16 rounded-2xl object-cover border" alt="prod" />
             <div className="flex-1 text-left">
               <div className="flex justify-between">
                   <span className="text-xs font-black text-slate-900 uppercase">Vận đơn: #{order.id}</span>
                   <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase bg-emerald-50 text-emerald-600">{order.status}</span>
               </div>
               <p className="text-base font-black text-[#006c49] mt-1">{order.total}</p>
             </div>
             <ChevronRight size={20} className="text-slate-300 group-hover:text-[#006c49] transition-all"/>
           </div>
         ))}
      </div>
    </div>
  );
}