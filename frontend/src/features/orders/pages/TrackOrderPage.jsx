import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function TrackOrderPage() {
  const { orderId } = useParams();
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    { label: "Order Placed", icon: "🧾" },
    { label: "Preparing Food", icon: "👨‍🍳" },
    { label: "Out for Delivery", icon: "🚴‍♂️" },
    { label: "Delivered", icon: "✅" },
  ];

  // Simulate status progress automatically
  useEffect(() => {
    window.scrollTo(0, 0);
    const interval = setInterval(() => {
      setStatusIndex((prev) =>
        prev < statuses.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [statuses.length]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold text-green-600 mb-2">
          🚚 Track Your Order
        </h1>
        <p className="text-gray-600">Order ID: #{orderId}</p>
      </motion.div>

      {/* Progress Tracker */}
      <div className="relative flex flex-col sm:flex-row justify-between items-center gap-10 sm:gap-0">
        {statuses.map((status, index) => (
          <div
            key={status.label}
            className="flex flex-col items-center relative"
          >
            {/* Connecting line */}
            {index < statuses.length - 1 && (
              <div
                className={`absolute sm:top-5 top-10 sm:left-1/2 left-1/2 transform sm:-translate-x-0 -translate-x-1/2 w-1 sm:w-32 h-20 sm:h-1 transition-all duration-500 ${
                  index < statusIndex ? "bg-green-500" : "bg-gray-300"
                }`}
              ></div>
            )}

            {/* Status Icon with animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: index <= statusIndex ? 1.1 : 1,
                opacity: 1,
                backgroundColor:
                  index <= statusIndex ? "#22c55e" : "#e5e7eb",
              }}
              transition={{ duration: 0.5 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md mb-3 ${
                index <= statusIndex ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              {status.icon}
            </motion.div>

            {/* Label */}
            <span
              className={`text-sm font-medium ${
                index <= statusIndex
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {status.label}
            </span>
          </div>
        ))}
      </div>

      {/* ETA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-gray-700 text-lg mb-1">
          Estimated Delivery Time:
        </p>
        <p className="text-2xl font-bold text-gray-800">
          30–40 minutes ⏱️
        </p>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 text-center">
        <Link
          to="/"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md"
        >
          ⬅️ Back to Home
        </Link>

        <Link
          to="/orders"
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition shadow-md"
        >
          🔁 Track Another Order
        </Link>
      </div>
    </div>
  );
}