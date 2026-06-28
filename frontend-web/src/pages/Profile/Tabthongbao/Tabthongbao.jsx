import React from "react";
import { Package } from "lucide-react";

export default function Tabthongbao({ notifications }) {
  return (
    <div className="space-y-6 text-left">
      <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Thông báo trung tâm</h2>
      <div className="space-y-3">
         {notifications.map(noti => (
           <div key={noti.id} className="flex gap-4 p-4 rounded-2xl border bg-white border-slate-100 hover:shadow-sm transition-all">
             <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-slate-50 text-[#006c49]"><Package size={20}/></div>
             <div className="flex-1 text-left">
               <div className="flex justify-between items-start">
                   <h5 className="font-bold text-slate-900 text-sm truncate pr-4">{noti.title}</h5>
                   <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{noti.time}</span>
               </div>
               <p className="text-xs text-slate-500 mt-1">{noti.desc}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
}