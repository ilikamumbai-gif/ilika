import React from "react";

const AdminTable = ({ columns = [], data = [], actions, emptyText = "No data found", loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 flex items-center justify-center" style={{ border: "1px solid #EBEBEB" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* DESKTOP */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide ${col.align === "right" ? "text-right" : "text-left"}`}
                  style={{ color: "#888" }}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-right" style={{ color: "#888" }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map((row, ri) => (
                <tr
                  key={row.id || ri}
                  className="hover:bg-gray-50/60 transition-colors"
                  style={{ borderBottom: "1px solid #F5F5F5" }}
                >
                  {columns.map((col, ci) => (
                    <td
                      key={ci}
                      className={`px-5 py-3.5 text-gray-700 ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-3.5 text-right">{actions(row)}</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-5 py-12 text-center"
                  style={{ color: "#bbb" }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-300 text-lg">∅</span>
                    </div>
                    <p className="text-sm">{emptyText}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden divide-y divide-gray-100">
        {data.length ? (
          data.map((row, ri) => (
            <div key={row.id || ri} className="p-4 space-y-2.5">
              {columns.map((col, ci) => (
                <div key={ci} className="flex justify-between items-start gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#999" }}>
                    {col.label}
                  </span>
                  <span className="text-sm text-gray-800 font-medium text-right">
                    {col.render ? col.render(row) : row[col.key]}
                  </span>
                </div>
              ))}
              {actions && (
                <div className="flex justify-end pt-2">{actions(row)}</div>
              )}
            </div>
          ))
        ) : (
          <p className="p-8 text-center text-sm text-gray-300">{emptyText}</p>
        )}
      </div>
    </div>
  );
};

export default AdminTable;
