import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import { CheckCircle, XCircle, AlertCircle, Camera, RotateCw, ArrowLeft, Ticket, MapPin, Calendar, Clock, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

const ScanTicket = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const eventIdFromUrl = searchParams.get('event');
  
  const [scanning, setScanning] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, remaining: 0 });
  const [lastScans, setLastScans] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  
  const html5QrCodeRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const successSound = useRef(new Audio('/success.mp3'));
  const errorSound = useRef(new Audio('/error.mp3'));

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices?.length) {
        setCameras(devices);
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCamera && scannerContainerRef.current && !loading) {
      startScanner();
    }
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [selectedCamera, loading]);

  const startScanner = async () => {
    if (!scannerContainerRef.current) return;
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop().catch(() => {});
      }
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      await html5QrCodeRef.current.start(
        selectedCamera,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          console.log('✅ تم قراءة QR Code من الكاميرا:', decodedText);
          if (!loading) handleScan(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      console.error("خطأ في بدء المسح:", err);
      setError("تعذر بدء الكاميرا");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {}
    }
    setScanning(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
   
    await stopScanner();
    setLoading(true);
    setError(null);
    
    const tempDiv = document.createElement('div');
    tempDiv.id = 'qr-reader-temp-' + Date.now();
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    try {
      const tempScanner = new Html5Qrcode(tempDiv.id);
      const decodedText = await tempScanner.scanFile(file, true);
      console.log('✅ تم قراءة QR Code من الصورة:', decodedText);
      await tempScanner.clear();
      document.body.removeChild(tempDiv);
      await handleScan(decodedText);
    } catch (err) {
      console.error("خطأ في قراءة الصورة:", err);
      document.body.removeChild(tempDiv);
      setError("لم يتم العثور على QR Code في الصورة");
      setTicketData({ checkinStatus: 'error' });
      setLoading(false);
      
      if (selectedCamera) await startScanner();
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    fetchOrganizerEvents();
  }, [currentUser]);

  useEffect(() => {
    if (eventIdFromUrl) setSelectedEvent(eventIdFromUrl);
  }, [eventIdFromUrl, events]);

  useEffect(() => {
    if (selectedEvent) fetchEventStats(selectedEvent);
  }, [selectedEvent]);

  const fetchOrganizerEvents = async () => {
    try {
      const token = localStorage.getItem("artAppToken");
      const res = await axios.get(`${API_BASE}/api/events`);
      const allEvents = res.data.data || [];
      const myEvents = allEvents.filter(e => 
        e.artist && String(e.artist._id || e.artist) === String(currentUser?._id)
      );
      setEvents(myEvents);
      if (myEvents.length && !eventIdFromUrl) {
        setSelectedEvent(myEvents[0]._id);
      }
    } catch (err) {
      console.error("خطأ في جلب الفعاليات:", err);
    }
  };

  const fetchEventStats = async (eventId) => {
    try {
      const token = localStorage.getItem("artAppToken");
      const res = await axios.get(`${API_BASE}/api/booking/event-stats/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data);
    } catch (err) {
      console.error("خطأ في جلب الإحصائيات:", err);
      setStats({ total: 0, checkedIn: 0, remaining: 0 });
    }
  };

  const handleScan = async (result) => {
    if (!result || loading) return;
    
    await stopScanner();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("artAppToken");
      
      let ticketId;
      try {
        const url = new URL(result);
        ticketId = url.pathname.split('/').pop();
      } catch {
        try {
          const json = JSON.parse(result);
          ticketId = json.ticketId || json.bookingId || json._id;
        } catch {
          ticketId = result.split('/').pop();
        }
      }
      
      console.log('🎫 ticketId:', ticketId);
      if (!ticketId) throw new Error("لم يتم العثور على معرف التذكرة");
      
      const verifyRes = await axios.get(`${API_BASE}/api/booking/verify/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const booking = verifyRes.data.data;
      
      if (booking.event?._id !== selectedEvent) {
        throw new Error("هذه التذكرة لفعالية أخرى");
      }
      
      const checkinRes = await axios.put(
        `${API_BASE}/api/booking/checkin/${ticketId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTicketData({
        ...checkinRes.data.data,
        checkinTime: new Date(),
        checkinStatus: 'success'
      });
      
      setLastScans(prev => [{
        id: ticketId,
        ticketId: ticketId.slice(-8).toUpperCase(),
        username: booking.user?.username || 'زائر',
        time: new Date(),
        success: true
      }, ...prev.slice(0, 4)]);
      
      fetchEventStats(selectedEvent);
      successSound.current.play().catch(() => {});
      
    } catch (err) {
      console.error("خطأ في الفحص:", err);
      setError(err.response?.data?.message || err.message || "تذكرة غير صالحة");
      setTicketData({ checkinStatus: 'error' });
      
      setLastScans(prev => [{
        id: Date.now(),
        ticketId: '------',
        username: 'خطأ',
        time: new Date(),
        success: false
      }, ...prev.slice(0, 4)]);
      
      errorSound.current.play().catch(() => {});
    } finally {
      setLoading(false);
     
      if (selectedCamera) await startScanner();
    }
  };

  const resetScanner = async () => {
    setTicketData(null);
    setError(null);
    setLoading(false);
    if (selectedCamera) await startScanner();
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    await stopScanner();
    const idx = cameras.findIndex(c => c.id === selectedCamera);
    setSelectedCamera(cameras[(idx + 1) % cameras.length].id);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const selectedEventData = events.find(e => e._id === selectedEvent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/events')} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Camera size={24} className="text-emerald-400" />
                  <span>فحص التذاكر</span>
                </h1>
              </div>
            </div>
            
            <select value={selectedEvent || ''} onChange={(e) => setSelectedEvent(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
              {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        
        {selectedEventData && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">إجمالي</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
              <p className="text-emerald-400 text-sm">تم الدخول</p>
              <p className="text-3xl font-bold text-emerald-400">{stats.checkedIn}</p>
            </div>
            <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
              <p className="text-amber-400 text-sm">متبقي</p>
              <p className="text-3xl font-bold text-amber-400">{stats.remaining}</p>
            </div>
          </div>
        )}

        
        {selectedEventData && (
          <div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700">
            <h2 className="font-bold text-lg mb-2">{selectedEventData.title}</h2>
            <div className="flex gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(selectedEventData.date)}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {selectedEventData.location}</span>
            </div>
          </div>
        )}

       
        <div className="mb-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium flex items-center gap-2"
          >
            <Upload size={20} />
            <span>رفع صورة QR</span>
          </button>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
        
          <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700">
            {!loading && ticketData?.checkinStatus !== 'success' ? (
              <div className="relative aspect-square">
                <div id="qr-reader" ref={scannerContainerRef} className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-emerald-400 rounded-3xl relative">
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />
                  </div>
                </div>
                <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
                  وجه الكاميرا نحو رمز QR
                </p>
                {cameras.length > 1 && (
                  <button onClick={switchCamera} className="absolute top-4 right-4 bg-slate-900/80 p-3 rounded-full">
                    <RotateCw size={20} />
                  </button>
                )}
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center p-6">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mx-auto mb-4" />
                    <p>جاري التحقق...</p>
                  </div>
                ) : ticketData?.checkinStatus === 'success' ? (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={56} className="text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-400 mb-2">تم الدخول!</h3>
                    <p className="text-slate-400">{ticketData.user?.username}</p>
                    <p className="text-slate-500 text-sm mb-6">{ticketData.quantity} تذاكر</p>
                    <button onClick={resetScanner} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl">
                      فحص تذكرة أخرى
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle size={56} className="text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-red-400 mb-2">تذكرة غير صالحة</h3>
                    <p className="text-slate-400 text-sm mb-6">{error}</p>
                    <button onClick={resetScanner} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl">
                      حاول مرة أخرى
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* لوحة المعلومات */}
          <div className="space-y-6">
            {ticketData?.checkinStatus === 'success' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-emerald-700/50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  تم الدخول للتو
                </h3>
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">رقم التذكرة</p>
                    <p className="text-xl font-mono font-bold">#{ticketData._id?.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-700/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">صاحب التذكرة</p>
                      <p className="font-bold">{ticketData.user?.username || 'زائر'}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">عدد التذاكر</p>
                      <p className="font-bold">{ticketData.quantity}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4">
                    <p className="text-emerald-400 text-sm flex items-center gap-1"><Clock size={14} /> وقت الدخول</p>
                    <p className="text-2xl font-bold text-emerald-400 font-mono">{formatTime(ticketData.checkinTime)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Ticket size={18} className="text-slate-400" />
                آخر التذاكر
              </h3>
              {lastScans.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">لم يتم فحص أي تذكرة بعد</p>
              ) : (
                <div className="space-y-2">
                  {lastScans.map((scan, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${scan.success ? 'bg-slate-700/30' : 'bg-red-900/20'}`}>
                      <div className="flex items-center gap-3">
                        {scan.success ? <CheckCircle size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-red-400" />}
                        <div>
                          <p className="font-mono text-sm">#{scan.ticketId}</p>
                          <p className="text-xs text-slate-400">{scan.username}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{formatTime(scan.time)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-400" />
                تعليمات
              </h3>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>• وجه الكاميرا نحو رمز QR لفحص التذكرة</li>
                <li>• أو اضغط على "رفع صورة QR" لرفع صورة</li>
                <li>• التذكرة تستخدم لمرة واحدة فقط</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanTicket;