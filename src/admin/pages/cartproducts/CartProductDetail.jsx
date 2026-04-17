import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useCartEvents } from "../../context/CartEventContext";
import { db } from "../../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";

const formatDate = (date) => {
  if (!date) return "-";

  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleString();
  }

  return new Date(date).toLocaleString();
};

const CartProductDetail = () => {

  const { productId } = useParams();
  const { events } = useCartEvents();

  const [users, setUsers] = useState([]);
  const [addresses, setAddresses] = useState({});

  /* ================= LOAD USERS ================= */

  useEffect(() => {

    const loadUsers = async () => {

      const snap = await getDocs(
        collection(db, "users")
      );

      const data = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));

      setUsers(data);

      // load address for each user
      data.forEach(loadAddress);

    };

    loadUsers();

  }, []);


  /* ================= LOAD ADDRESS ================= */

  const loadAddress = async (user) => {

    const snap = await getDocs(
      collection(db, "users", user.uid, "addresses")
    );

    if (!snap.empty) {

      const addr = snap.docs[0].data();

      setAddresses(prev => ({
        ...prev,
        [user.uid]: addr,
      }));

    }

  };


  /* ================= FILTER PRODUCT ================= */

  const filtered = events.filter(
    e => e.productId === productId
  );

  if (filtered.length === 0) {
    return (
      <AdminLayout>
        <p >No data</p>
      </AdminLayout>
    );
  }

  const product = filtered[0];

  const getUser = (uid) => {
    return users.find(u => u.uid === uid);
  };

  const getAddress = (uid) => {
    return addresses[uid];
  };

  return (
    <AdminLayout>

      <div className=" max-w-6xl mx-auto">

        <h1 className="text-xl font-semibold mb-6">
          Product Interest Details
        </h1>

        {/* PRODUCT */}
        <div className="flex gap-4 mb-6">

          <img
            src={product.image}
            className="w-24 h-24 rounded object-cover"
          />

          <div>

            <p className="font-semibold">
              {product.name}
            </p>

            <p>₹{product.price}</p>

            <p>
              Total Users:
              <b> {filtered.length} </b>
            </p>

          </div>

        </div>


        {/* TABLE */}

        <div className="border rounded-xl overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b">

              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-left">Date</th>
              </tr>

            </thead>

            <tbody>

              {filtered.map(e => {

                const user = getUser(e.userId);
                const addr = getAddress(e.userId);

                return (

                  <tr key={e.id} className="border-b">

                    <td className="p-3">
                      {user?.name || "Guest"}
                    </td>

                    <td className="p-3">
                      {user?.email || e.userEmail || "-"}
                    </td>

                    <td className="p-3">
                      {user?.phone || addr?.phone || "-"}
                    </td>

                    <td className="p-3 text-xs">

                      {addr
                        ? `${addr.line || ""}, ${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`
                        : "-"}

                    </td>

                    <td className="p-3">
                      {formatDate(e.createdAt)}
                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

    </AdminLayout>
  );
};

export default CartProductDetail;