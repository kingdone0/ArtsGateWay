import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import { Calendar, MapPin, Users, Ticket, Clock, X, QrCode, Sparkles, Download, ArrowLeft } from "lucide-react"; 
import QRCode from "react-qr-code";

const API_BASE = "http://localhost:5000";

const TicketModal = ({ booking, onClose }) => {

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const qrData = JSON.stringify({
    ticketId: booking._id,
    eventId: booking.event?._id,
    eventTitle: booking.event?.title,
    quantity: booking.quantity,
    totalPrice: booking.totalPrice,
    bookingDate: booking.createdAt,
    eventDate: booking.event?.date,
    userId: booking.user
  });

  const handleDownloadQR = () => {
    const svg = document.getElementById('ticket-qr-code');
    if (!svg) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      
      const link = document.createElement('a');
      link.download = `ticket-${booking._id.slice(-8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all text-slate-600 hover:text-rose-500"
        >
          <X size={20} />
        </button>
        
        <div className="relative h-48 bg-gradient-to-br from-rose-400 to-pink-500">
          {booking.event?.image ? (
            <img
              src={`${API_BASE}${booking.event.image}`}
              alt={booking.event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Ticket size={64} className="text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-2xl font-bold text-white mb-1">{booking.event?.title}</h2>
            <p className="text-white/80 text-sm">{formatDate(booking.event?.date)}</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">رقم التذكرة</p>
                <p className="font-mono font-medium text-slate-700">#{booking._id?.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">تاريخ الحجز</p>
                <p className="font-medium text-slate-700">{formatDate(booking.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">عدد التذاكر</p>
                <p className="font-medium text-slate-700">{booking.quantity}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">المبلغ</p>
                <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">${booking.totalPrice}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-rose-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">الموقع</p>
                <p className="font-medium text-slate-700">{booking.event?.location || 'غير محدد'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-rose-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">الوقت</p>
                <p className="font-medium text-slate-700">{formatTime(booking.event?.date)}</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-4 flex items-center justify-center gap-1">
              <QrCode size={16} />
              <span>امسح الرمز عند الدخول</span>
            </p>
            
            <div className="bg-white p-6 rounded-3xl shadow-inner border-2 border-dashed border-rose-200 inline-block">
              <QRCode
                id="ticket-qr-code"
                value={qrData}
                size={200}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
              />
            </div>
            
            <button
              onClick={handleDownloadQR}
              className="mt-4 inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 text-sm font-medium transition-colors"
            >
              <Download size={16} />
              <span>تحميل رمز QR</span>
            </button>
          </div>
        </div>
        
        <div className="border-t-2 border-dashed border-rose-200 px-6 py-3 flex justify-center gap-0.5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full ${i % 2 === 0 ? 'bg-rose-300' : 'bg-rose-200'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MyTickets = () => {
  const navigate = useNavigate(); 
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("artAppToken");
      const res = await axios.get(`${API_BASE}/api/booking/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data.data || []);
    } catch (err) {
      console.error("❌ فشل جلب الحجوزات:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const getEventStatus = (eventDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    
    if (event > today) return { label: 'قادم', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🎟️' };
    if (event.getTime() === today.getTime()) return { label: 'اليوم', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-100', text: 'text-amber-700', icon: '✨' };
    return { label: 'انتهى', color: 'from-gray-400 to-slate-500', bg: 'bg-gray-100', text: 'text-gray-500', icon: '📅' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex items-center justify-center">
        <div className="relative">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 text-center border border-rose-100 shadow-2xl">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 font-medium text-lg">جاري تحميل تذاكرك...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed bottom-0 left-0 opacity-[0.03] text-[15rem] pointer-events-none select-none">🎫</div>
        <div className="fixed top-10 right-0 opacity-[0.03] text-[15rem] pointer-events-none select-none rotate-12">🎪</div>
        
        <div className="relative max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 text-center border border-rose-100 shadow-xl">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <Ticket size={48} className="text-rose-400 -rotate-3" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">لا توجد تذاكر</h2>
            <p className="text-slate-500 mb-8">لم تقم بحجز أي فعالية بعد</p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Sparkles size={18} />
              <span>استعرض الفعاليات</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 py-10 px-4 relative overflow-hidden">
      
      <div className="fixed bottom-0 left-0 opacity-[0.03] text-[15rem] pointer-events-none select-none">🎫</div>
      <div className="fixed top-10 right-0 opacity-[0.03] text-[15rem] pointer-events-none select-none rotate-12">🎪</div>
      <div className="fixed bottom-20 right-10 opacity-[0.02] text-[10rem] pointer-events-none select-none -rotate-12">✨</div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
       
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-rose-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-rose-500"
          >
            <ArrowLeft size={18} />
            <span>رجوع</span>
          </button>
        </div>

      
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-5 py-2 border border-rose-200 shadow-sm mb-4">
            <Ticket size={16} className="text-rose-500" />
            <span className="text-rose-600 font-medium">تذاكري</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">
            حجوزاتي
            <span className="text-rose-500 ml-2">{bookings.length}</span>
          </h1>
          <p className="text-slate-500">تذاكر الفعاليات التي قمت بحجزها</p>
        </div>

        {/* قائمة التذاكر */}
        <div className="space-y-5">
          {bookings.map((booking) => {
            const status = getEventStatus(booking.event?.date);
            
            return (
              <div
                key={booking._id}
                className="group relative cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${status.color} rounded-[2.5rem] blur-lg transition-opacity duration-300 opacity-0 group-hover:opacity-60`}></div>
                
                <div className="relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-md group-hover:shadow-xl transition-all duration-300">
                  
                  <div className="absolute left-8 -top-3 w-6 h-6 bg-slate-50 rounded-full"></div>
                  <div className="absolute right-8 -top-3 w-6 h-6 bg-slate-50 rounded-full"></div>
                  
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-6 border-b sm:border-b-0 sm:border-r-2 border-dashed border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                          <span>{status.icon}</span>
                          <span>{status.label}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <Clock size={14} />
                          <span>#{booking._id?.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-1">
                        {booking.event?.title}
                      </h3>
                      <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                        {booking.event?.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                            <Calendar size={16} className="text-rose-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{formatDate(booking.event?.date)}</p>
                            <p className="text-xs text-slate-400">{formatTime(booking.event?.date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                            <MapPin size={16} className="text-rose-500" />
                          </div>
                          <p className="text-sm font-medium">{booking.event?.location || 'غير محدد'}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                            <Users size={16} className="text-rose-500" />
                          </div>
                          <p className="text-sm font-medium">{booking.quantity} تذاكر</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:w-44 p-6 bg-gradient-to-br from-slate-50 to-rose-50/30 flex flex-col items-center justify-center">
                      <div className="text-center mb-4">
                        <p className="text-slate-400 text-xs mb-1">المبلغ المدفوع</p>
                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                          ${booking.totalPrice}
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 text-center">
                        <QrCode size={48} className="text-slate-700 mx-auto mb-2" />
                        <p className="text-rose-500 text-xs font-medium">اضغط لعرض التذكرة</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute left-8 -bottom-3 w-6 h-6 bg-slate-50 rounded-full"></div>
                  <div className="absolute right-8 -bottom-3 w-6 h-6 bg-slate-50 rounded-full"></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* زر العودة للفعاليات */}
        <div className="text-center mt-10">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 font-medium transition-colors"
          >
            <Sparkles size={16} />
            <span>استعرض المزيد من الفعاليات</span>
          </Link>
        </div>
      </div>
      
      {selectedBooking && (
        <TicketModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}
    </div>
  );
};

export default MyTickets;