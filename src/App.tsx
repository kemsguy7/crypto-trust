import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ReviewSubmissionPage from "./pages/ReviewSubmissionPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import AdminModerationPage from "./pages/AdminModerationPage";
import PublicStatsPage from "./pages/PublicStatsPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import { MetricsPage } from "./pages/MetricsPage";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 bg-dots">
      {/* Header Navigation - Modern Crypto Style */}
      <header className="sticky top-0 z-50 glass border-b border-white/60 shadow-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Enhanced */}
            <Link
              to="/"
              className="flex items-center space-x-3 text-slate-900 hover:text-blue-600 transition-all duration-300 group"
              aria-label="CryptoTrust Home"
            >
              <div className="text-2xl transform group-hover:scale-110 transition-transform duration-300">
                🌟
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-slate-900">
                  CryptoTrust
                </span>
                <span className="text-xs text-slate-500 -mt-1">
                  Powered by Midnight
                </span>
              </div>
            </Link>

            {/* Navigation Bubble - Enhanced */}
            <div className="hidden lg:flex items-center nav-bubble px-2 py-2 space-x-1">
              <NavLink to="/" current={location.pathname === "/"}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
                  />
                </svg>
                Browse Projects
              </NavLink>
              <NavLink
                to="/submit-review"
                current={location.pathname === "/submit-review"}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Submit Review
              </NavLink>
              <NavLink to="/admin" current={location.pathname === "/admin"}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Admin
              </NavLink>
              <NavLink to="/stats" current={location.pathname === "/stats"}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Statistics
              </NavLink>
              <NavLink to="/privacy" current={location.pathname === "/privacy"}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Privacy
              </NavLink>
            </div>

            {/* Right side actions - Enhanced */}
            <div className="flex items-center space-x-4">
              {/* Wallet Connection Status - Enhanced */}
              <div className="hidden md:flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-full text-sm font-medium text-emerald-700 shadow-md">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                Midnight Connected
              </div>

              {/* GitHub Link - Enhanced */}
              <a
                href="https://github.com/depapp/midnight-whistleblower"
                className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 rounded-xl hover:bg-white/60 transform hover:scale-110"
                aria-label="GitHub"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>

              {/* Mobile menu button */}
              <button className="lg:hidden p-2 rounded-xl hover:bg-white/60 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden mt-4 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl">
            <div className="space-y-2">
              <MobileNavLink to="/" current={location.pathname === "/"}>
                Browse Projects
              </MobileNavLink>
              <MobileNavLink
                to="/submit-review"
                current={location.pathname === "/submit-review"}
              >
                Submit Review
              </MobileNavLink>
              <MobileNavLink
                to="/admin"
                current={location.pathname === "/admin"}
              >
                Admin Panel
              </MobileNavLink>
              <MobileNavLink
                to="/stats"
                current={location.pathname === "/stats"}
              >
                Statistics
              </MobileNavLink>
              <MobileNavLink
                to="/privacy"
                current={location.pathname === "/privacy"}
              >
                Privacy Policy
              </MobileNavLink>
            </div>
          </div>
        </nav>
      </header>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-24 focus:left-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg z-50"
      >
        Skip to main content
      </a>

      {/* Main Content - Enhanced */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="animate-fadeIn">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/submit-review" element={<ReviewSubmissionPage />} />
            <Route path="/project/:id" element={<ProjectDetailsPage />} />
            <Route path="/admin" element={<AdminModerationPage />} />
            <Route path="/stats" element={<PublicStatsPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Routes>
        </div>
      </main>

      {/* Footer - Enhanced */}
      <footer className="bg-gradient-to-r from-slate-100/80 to-blue-100/80 border-t border-white/60 mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌟</span>
                <span className="font-bold text-xl gradient-text">
                  CryptoTrust
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Privacy-first crypto project reviews powered by Midnight
                Network's zero-knowledge technology.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Platform</h3>
              <div className="space-y-2">
                <Link
                  to="/"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Browse Projects
                </Link>
                <Link
                  to="/submit-review"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Submit Review
                </Link>
                <Link
                  to="/stats"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Platform Statistics
                </Link>
                <Link
                  to="/privacy"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Resources</h3>
              <div className="space-y-2">
                <a
                  href="https://github.com/depapp/midnight-whistleblower"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  GitHub Repository
                </a>
                <a
                  href="https://docs.midnight.network"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Midnight Network Docs
                </a>
                <a
                  href="#"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  API Documentation
                </a>
                <a
                  href="#"
                  className="block text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Support Center
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-slate-500">
              © 2024 CryptoTrust. Built with 🔐 on Midnight Network.
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-1 text-xs text-slate-400">
              <span>Powered by</span>
              <span className="font-semibold text-blue-600">
                Zero-Knowledge Proofs
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Navigation Link Component - Enhanced
interface NavLinkProps {
  to: string;
  current: boolean;
  children: React.ReactNode;
}

function NavLink({ to, current, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={
        current
          ? "nav-link-active"
          : "px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 text-slate-800 hover:text-slate-900 hover:bg-white/60"
      }
      aria-current={current ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

// Mobile Navigation Link Component
interface MobileNavLinkProps {
  to: string;
  current: boolean;
  children: React.ReactNode;
}

function MobileNavLink({ to, current, children }: MobileNavLinkProps) {
  return (
    <Link
      to={to}
      className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        current
          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
      }`}
      aria-current={current ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export default App;
