import React from "react";

const AdminTable = ({
  columns = [],
  data = [],
  actions,
  emptyText = "No data found",
}) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border overflow-hidden">

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 font-medium text-gray-600 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.length ? (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-none hover:bg-gray-50 transition"
                >
                  {columns.map((col, index) => (
                    <td
                      key={index}
                      className={`px-4 py-3 text-gray-700 ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden divide-y">
        {data.length ? (
          data.map((row) => (
            <div key={row.id} className="p-4 space-y-2">
              {columns.map((col, index) => (
                <div key={index} className="flex justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    {col.label}
                  </span>
                  <span className="text-sm text-gray-800 font-medium text-right">
                    {col.render ? col.render(row) : row[col.key]}
                  </span>
                </div>
              ))}

              {actions && (
                <div className="flex justify-end pt-2">
                  {actions(row)}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-gray-400">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminTable;
