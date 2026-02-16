import React from "react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "bg-blue-100",
  textColor = "text-blue-600",
  footer,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex items-center justify-between hover:shadow-md transition">

      {/* LEFT CONTENT */}
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>

        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          {value}
        </h2>

        {footer && (
          <p className="text-xs text-gray-400 mt-1">
            {footer}
          </p>
        )}
      </div>

      {/* ICON */}
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${color}`}
      >
        {Icon && <Icon className={`w-6 h-6 ${textColor}`} />}
      </div>
    </div>
  );
};

export default StatCard;
