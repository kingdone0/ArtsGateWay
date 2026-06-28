import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Plus, Flag, Camera, MapPin, Users, Ticket, Star, QrCode, ArrowLeft, Search, X } from "lucide-react";
import { io } from "socket.io-client";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import ReportModal from "../Components/ReportModal";

const API_BASE = "http://localhost:5000";

const EventsComponent = () => {
  const navigate = useNavigate();
  const { address, isConnected, contract, provider } = useWallet();
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingEventId, setBookingEventId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const newSocket = io(API_BASE);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && events.length > 0) {
      events.forEach(event => socket.emit('join-event', event._id));
      socket.on('seats-updated', (data) => {
        setEvents(prev => prev.map(e => e._id === data.eventId ? { ...e, bookedSeats: data.bookedSeats } : e));
      });
      return () => socket.off('seats-updated');
    }
  }, [socket, events]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/events`);
        let eventsArray = res.data?.data || res.data || [];
        const approvedEvents = eventsArray.filter(e => e.status === "approved");
        setEvents(approvedEvents);
      } catch (err) {
        console.error("❌ فشل جلب الفعاليات:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const isEventOrganizer = (event) => {
    if (!currentUser || !event.artist) return false;
    const artistId = typeof event.artist === 'object' ? event.artist._id : event.artist;
    const userId = currentUser._id || currentUser.id;
    return String(artistId) === String(userId);
  };

  const handleScanTickets = (eventId) => navigate(`/scan-ticket?event=${eventId}`);

  const handleReport = (event, e) => {
    e?.preventDefault?.();
    if (!currentUser) return alert('يجب تسجيل الدخول للإبلاغ');
    setSelectedEvent(event);
    setShowReportModal(true);
  };

  const handleBooking = async (eventId, price) => {
    setBooking(true);
    setBookingEventId(eventId);
    try {
      const token = localStorage.getItem("artAppToken");
      if (!isConnected || !address) return alert("⚠️ يجب الاتصال بالمحفظة");
      if (!contract) return alert("⚠️ العقد الذكي غير متصل");
      
      const priceInWei = ethers.parseEther(price.toString());
      const balance = await provider.getBalance(address);
      if (balance < priceInWei) return alert(`❌ رصيد غير كافٍ`);

      const numericId = parseInt(eventId.slice(-8), 16);
      const tx = await contract.bookTicket(numericId, { value: priceInWei });
      await tx.wait();
      
      await axios.post(`${API_BASE}/api/booking/${eventId}`, { quantity: 1, transactionHash: tx.hash }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ تم الحجز بنجاح!");
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, bookedSeats: (e.bookedSeats || 0) + 1 } : e));
    } catch (err) {
      alert("❌ فشل الحجز: " + (err.message || "خطأ غير معروف"));
    } finally {
      setBooking(false);
      setBookingEventId(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

  const filteredEvents = events.filter(evt => 
    evt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evt.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearSearch = () => setSearchTerm('');

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 text-center shadow-2xl">
        <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">جاري تحميل الفعاليات...</p>
      </div>
    </div>
  );

  if (!events.length) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 py-12 relative overflow-hidden">
      <div className="fixed bottom-0 left-0 opacity-[0.03] text-[15rem] pointer-events-none select-none">🎪</div>
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-rose-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-rose-500"
          >
            <ArrowLeft size={18} />
            <span>رجوع</span>
          </button>
          
          <Link to="/events/create" className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-3 rounded-xl font-medium shadow-md">
            <Plus size={20} /><span>إنشاء فعالية</span>
          </Link>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl">
          <Calendar size={56} className="text-rose-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-3">لا توجد فعاليات</h2>
          <Link to="/events/create" className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-xl">
            <Star size={18} /><span>أنشئ أول فعالية</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 py-10 px-4 relative overflow-hidden">
      <div className="fixed bottom-0 left-0 opacity-[0.03] text-[15rem] pointer-events-none select-none">🎪</div>
      <div className="fixed top-10 right-0 opacity-[0.03] text-[15rem] pointer-events-none select-none rotate-12">🎫</div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-rose-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-rose-500"
          >
            <ArrowLeft size={18} />
            <span>رجوع</span>
          </button>
          
          <Link to="/events/create" className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-3 rounded-xl font-medium shadow-md">
            <Plus size={20} /><span>إنشاء فعالية</span>
          </Link>
        </div>

        {/* ✅ شريط البحث - في المنتصف */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="ابحث عن فعالية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 pr-14 bg-white border border-rose-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-md text-lg"
            />
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 flex items-center">
              {searchTerm ? (
                <button onClick={clearSearch} className="text-gray-400 hover:text-rose-500 transition-colors">
                  <X size={22} />
                </button>
              ) : (
                <Search size={22} className="text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* ✅ رسالة عدم وجود نتائج */}
        {filteredEvents.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg">لا توجد فعاليات تطابق بحثك "{searchTerm}"</p>
            <button onClick={clearSearch} className="mt-4 text-rose-500 hover:text-rose-600 font-medium">
              عرض جميع الفعاليات
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isOrganizer = isEventOrganizer(evt);
            const remaining = evt.capacity - (evt.bookedSeats || 0);
            
            return (
              <div key={evt._id} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  {evt.image ? <img src={`${API_BASE}${evt.image}`} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center"><Calendar size={48} className="text-rose-300" /></div>}
                  
                  <button onClick={(e) => handleReport(evt, e)} disabled={!currentUser}
                    className={`absolute top-3 left-3 p-2 rounded-full shadow-md ${!currentUser ? "bg-gray-100 text-gray-400" : "bg-white/90 text-gray-600 hover:text-red-500"}`}>
                    <Flag size={16} />
                  </button>
                </div>
                
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{evt.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{evt.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm"><MapPin size={14} className="text-rose-400" /><span>{evt.location}</span></div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm"><Calendar size={14} className="text-rose-400" /><span>{formatDate(evt.date)}</span></div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm"><Users size={14} className="text-rose-400" />
                      <span>المقاعد: <span className={`font-medium ${remaining < 5 ? 'text-rose-500' : 'text-emerald-500'}`}>{remaining}</span>/{evt.capacity}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div><p className="text-slate-400 text-xs">السعر</p><p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">{evt.price} ETH</p></div>
                    
                    {isOrganizer ? (
                      <button onClick={() => handleScanTickets(evt._id)} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-md">
                        <QrCode size={18} /><span>فحص التذاكر</span>
                      </button>
                    ) : (
                      <button onClick={() => handleBooking(evt._id, evt.price)} disabled={booking || remaining === 0}
                        className={`px-5 py-2.5 rounded-xl font-medium ${remaining === 0 ? "bg-gray-200 text-gray-500" : "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"}`}>
                        {booking && bookingEventId === evt._id ? "جاري الحجز..." : remaining === 0 ? "نفدت المقاعد" : "احجز الآن"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} targetType="event" targetId={selectedEvent?._id} />
    </div>
  );
};

export default EventsComponent;