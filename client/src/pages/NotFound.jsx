import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-8xl mb-4">🍽️</p>
        <h1 className="text-4xl font-black text-gray-900 mb-2">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <Link to="/" className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;