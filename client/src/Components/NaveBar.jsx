import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { Home, Compass, User, CreditCard, LogOut, Calendar } from "react-feather"; 

const Navbar = () => {
  const { logout, currentUser } = useAuth();
  const { 
    address,
    usdBalance,
    ethBalance, 
    isConnected,
    connectWallet,     
    connectMetaMask, 
    disconnectWallet,
    networkName
  } = useWallet();
  
  const navigate = useNavigate();
  const token = localStorage.getItem("artAppToken");
  const [scrolled, setScrolled] = useState(false);
  const [walletHover, setWalletHover] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const location = useLocation();
  const userID = currentUser?._id || currentUser?.id;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const navLinks = [
    { name: "الرئيسية", path: "/", icon: <Home size={18} /> },
    { name: "استكشف", path: "/explore", icon: <Compass size={18} /> },
    { name: "الفنانين", path: "/artists", icon: <User size={18} /> },
    { name: "الفعاليات", path: "/events", icon: <Calendar size={18} /> },
    ...(!token
      ? [{ name: "تسجيل الدخول", path: "/auth", icon: <User size={18} /> }]
      : [
          { name: "حجوزاتي", path: "/my-bookings", icon: <Calendar size={18} /> },
          { name: "حسابي", path: `/profile/${userID}`, icon: <User size={18} /> },
          { name: "تسجيل الخروج", onClick: () => handleLogout(), icon: <LogOut size={18} /> },
        ]),
  ];

  const isActive = (path) => location.pathname === path;


const handleWalletClick = async () => {
  if (!currentUser) return alert("سجل دخول أولاً");
  if (window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  } else {
    alert("ثبّت MetaMask أولاً");
  }

  if (isConnected) {
    const confirmDisconnect = window.confirm(
      `✅ المحفظة متصلة حالياً\n` +
      `هل تريد قطع الاتصال؟`
    );
    
    if (confirmDisconnect) {
      disconnectWallet(); 
      alert("🔌 تم قطع الاتصال بالمحفظة");
    }
    return;
  }

  if ( !isConnected)
  try {
    const result = await connectWallet();
    if (result?.success) {
      alert(`✅ تم الاتصال بالمحفظة\nالعنوان: ${shortenAddress(result.address)}`);
    }
  } catch (err) {
    console.error("❌ فشل الاتصال:", err);
  } finally {
    setIsProcessing(false);
  }
};

 
  const handleLogout = async () => {
    await logout();
    disconnectWallet();
    navigate("/");
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md shadow-lg py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ArtWay" className="w-10 h-10 object-contain" />
            <span
              className={`text-xl font-bold transition-colors ${
                scrolled ? "text-gray-800" : "text-white"
              }`}
            >
              ArtWay
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path || "#"}
                  onClick={link.onClick}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    link.path && isActive(link.path)
                      ? "bg-[#d5006d] text-white shadow-md"
                      : scrolled
                      ? "text-gray-700 hover:bg-gray-200/70"
                      : "text-white/90 hover:bg-white/20"
                  }`}
                >
                  <span className="ml-2">{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>
            
            {token && (
              <div className="relative">
                <button
                  onClick={handleWalletClick}
                  onMouseEnter={() => setWalletHover(true)}
                  onMouseLeave={() => setWalletHover(false)}
                  disabled={isProcessing}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-300 border
                    ${
                      isConnected
                        ? scrolled
                          ? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                          : "bg-pink-500/20 border-pink-400/30 text-white hover:bg-pink-500/30"
                        : scrolled
                        ? "bg-pink-600 border-pink-600 text-white hover:bg-pink-700"
                        : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                    }
                    ${walletHover && isConnected ? "scale-105" : ""}
                    ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <CreditCard size={16} />
                  <span>
                    {isProcessing
                      ? "جاري الاتصال..."
                      : isConnected
                      ? walletHover
                        ? "قطع الاتصال"
                        : shortenAddress(address)
                      : "اتصل بالمحفظة"}
                  </span>
                  {isConnected && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-600 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-600"></span>
                    </span>
                  )}
                </button>

                {isConnected && (
                  <div className="absolute left-0 right-0 top-full mt-2 flex flex-col gap-1 min-w-[220px]">
                    <div
                      className={`text-xs px-4 py-3 rounded-xl shadow-xl ${
                        scrolled
                          ? "bg-white text-gray-800 border border-gray-100"
                          : "bg-gray-900/90 backdrop-blur-md text-white border border-white/10"
                      }`}
                    >

                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/20">
                        <span className="opacity-75">الرصيد:</span>
                        <span className="font-bold text-green-400 text-lg">
                        ${parseFloat(usdBalance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;