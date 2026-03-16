import React from "react";

const StatCard = ({ title, value, icon: Icon, color = "bg-pink-100", textColor = "text-pink-600", footer, trend }) => {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex items-start justify-between group hover:-translate-y-0.5 transition-all duration-200"
      style={{ border: "1px solid #EBEBEB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "#999" }}>{title}</p>
        <h2 className="text-2xl font-bold text-gray-900 leading-none mb-1">
          {typeof value === "number" && title.toLowerCase().includes("revenue")
            ? `₹${value.toLocaleString("en-IN")}`
            : value}
        </h2>
        {footer && <p className="text-xs mt-1.5" style={{ color: "#999" }}>{footer}</p>}
        {trend !== undefined && (
          <p className={`text-xs font-medium mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ml-3 ${color}`}>
        {Icon && <Icon className={`w-5 h-5 ${textColor}`} />}
      </div>
    </div>
  );
};

export default StatCard;
