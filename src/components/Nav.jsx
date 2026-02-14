import React, { useState } from "react";
import { Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import productData from "../Dummy/productsData";
import { useCart } from "../context/CartProvider";

const Nav = ({ mobile, onClose }) => {
  const { openCart } = useCart();

  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const filtered =
    query.length > 0
      ? productData.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className={`${mobile ? "space-y-4" : "flex items-center gap-8"} heading-2-color`}>

      {/* LINKS */}
      <nav className={`${mobile ? "flex flex-col gap-3" : "flex gap-8"}`}>

        <Link to="/" onClick={onClose}>Home</Link>
        <Link to="/offer" onClick={onClose}>Offer</Link>

        {/* SKIN */}
        <div className="relative group">
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => toggleMenu("skin")}
          >
            <span>Skin</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openMenu === "skin" ? "rotate-180" : ""
              }`}
            />
          </div>

          <div className={`
            ${mobile || openMenu === "skin" ? "block" : "hidden group-hover:block"}
            absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md min-w-[160px] z-50
          `}>
            <Link to="/skin/face" onClick={onClose} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Face
            </Link>
            <Link to="/skin/body" onClick={onClose} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Body
            </Link>
          </div>
        </div>

        {/* HAIR */}
        <div className="relative group">
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => toggleMenu("hair")}
          >
            <span>Hair</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openMenu === "hair" ? "rotate-180" : ""
              }`}
            />
          </div>

          <div className={`
            ${mobile || openMenu === "hair" ? "block" : "hidden group-hover:block"}
            absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md min-w-[160px] z-50
          `}>
            <Link to="/hair/care" onClick={onClose} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Care
            </Link>
            <Link to="/hair/styling" onClick={onClose} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Styling
            </Link>
          </div>
        </div>

        {/* GROOMING */}
        <div className="relative group">
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => toggleMenu("grooming")}
          >
            <span>Grooming</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openMenu === "grooming" ? "rotate-180" : ""
              }`}
            />
          </div>

          <div className={`
            ${mobile || openMenu === "grooming" ? "block" : "hidden group-hover:block"}
            absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md min-w-[160px] z-50
          `}>
            <Link to="/grooming/face" onClick={onClose} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Face
            </Link>
            <Link to="/grooming/roller" onClick={onClose} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Roller
            </Link>
            <Link to="/grooming/remover" onClick={onClose} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Remover
            </Link>
          </div>
        </div>

        <Link to="/ctm" onClick={onClose}>Explore CTM</Link>
        <Link to="/blog" onClick={onClose}>Blog</Link>
      </nav>

      {/* ICONS */}
      <div className="flex items-center gap-5">

        {/* SEARCH */}
        <div className="relative">
          <div className="flex items-center border rounded-md px-2">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              className="outline-none px-2 py-1 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {query && (
            <div className="absolute bg-white shadow-lg rounded-md mt-2 w-full z-50">
              {filtered.length ? (
                filtered.map(product => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    state={product}
                    className="block px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setQuery("");
                      onClose?.();
                    }}
                  >
                    {product.name}
                  </Link>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">
                  No products found
                </p>
              )}
            </div>
          )}
        </div>

        {/* CART */}
        <ShoppingBag
          className="w-5 h-5 cursor-pointer"
          onClick={openCart}
        />

        {/* USER */}
        <Link to="/user">
          <User />
        </Link>
      </div>
    </div>
  );
};

export default Nav;
