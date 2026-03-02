import React from "react";
import AdminLayout from "../../components/AdminLayout";
import { useCartEvents } from "../../context/CartEventContext";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";   // ✅ add

const CartProductList = () => {

  const { events } = useCartEvents();
  const navigate = useNavigate();

  // group by product
  const productMap = {};

  events.forEach(e => {

    if (!productMap[e.productId]) {
      productMap[e.productId] = e;
    }

  });

  const products = Object.values(productMap);

  return (
    <AdminLayout>

      <div className="mx-auto">

        <h1 className="text-xl font-semibold mb-6">
          Cart Interest Products
        </h1>

        {products.length === 0 ? (
          <p>No cart activity</p>
        ) : (

          <div className="border rounded-xl overflow-hidden">

            <table className="w-full text-sm">

              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">View</th>
                </tr>
              </thead>

              <tbody>

                {products.map((e) => (

                  <tr key={e.productId} className="border-b">

                    <td className="p-3">
                      <img
                        src={e.image}
                        alt={e.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>

                    <td className="p-3">
                      {e.name}
                    </td>

                    <td className="p-3">
                      ₹{e.price}
                    </td>

                    <td className="p-3">

                      <Eye
                        size={18}
                        className="cursor-pointer text-blue-600 hover:text-blue-800"
                        onClick={() =>
                          navigate(`/admin/cart-products/${e.productId}`)
                        }
                      />

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </AdminLayout>
  );
};

export default CartProductList;