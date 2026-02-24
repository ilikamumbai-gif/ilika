import { useNavigate } from "react-router-dom";

const LoginPopup = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">

      <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 relative shadow-xl">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center mb-3">
          Join Ilika
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          Login to unlock exclusive offers & faster checkout
        </p>

        <button
          onClick={() => navigate("/login")}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          Login / Register
        </button>

      </div>
    </div>
  );
};

export default LoginPopup;