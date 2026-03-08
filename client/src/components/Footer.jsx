import React from "react";
import { Link } from "react-router-dom";
import { FiInstagram, FiTwitter, FiFacebook, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-black">D</span>
              </div>
              <div>
                <span className="text-xl font-black text-orange-500">Dish</span>
                <span className="text-xl font-black text-white">Drop</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Fresh. Fast. Delivered. Order from the best restaurants near you and get your food delivered in minutes.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                <FiInstagram />
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                <FiTwitter />
              </a>
              <a href="#" aria-label="Facebook" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                <FiFacebook />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { to: "/", label: "Home" },
                { to: "/restaurants", label: "Restaurants" },
                { to: "/orders", label: "My Orders" },
                { to: "/recommendations", label: "AI Recommendations" },
                { to: "/chat", label: "AI Support" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">For Partners</h3>
            <ul className="space-y-2">
              {[
                { to: "/register", label: "Register as Restaurant" },
                { to: "/register", label: "Become a Delivery Agent" },
                { to: "/owner/dashboard", label: "Restaurant Dashboard" },
                { to: "/agent/dashboard", label: "Agent Dashboard" },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-3 bg-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <MdDeliveryDining className="text-orange-400 text-xl" />
                <span className="text-white text-sm font-semibold">Deliver with us</span>
              </div>
              <p className="text-xs text-gray-400">Earn up to Rs.1500/day delivering food</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-orange-400 text-lg mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">DishDrop HQ, Koramangala, Bangalore 560034</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-orange-400 flex-shrink-0" />
                <a href="tel:+919876543210" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-orange-400 flex-shrink-0" />
                <a href="mailto:support@dishdrop.com" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                  support@dishdrop.com
                </a>
              </li>
            </ul>
            <div className="mt-6 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Coming Soon</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-center opacity-60">
                  <p className="text-xs text-gray-400">App Store</p>
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-center opacity-60">
                  <p className="text-xs text-gray-400">Play Store</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {currentYear} DishDrop. All rights reserved. Made with love in India.
            </p>
            <div className="flex items-center gap-4">
              {["Privacy Policy", "Terms of Service", "Refund Policy"].map((label) => (
                <Link key={label} to="/" className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;