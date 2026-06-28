import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { ArrowLeft, Send, Image as ImageIcon, MoreVertical, Trash2, X } from "lucide-react";
import { useAuth } from '../context/AuthContext';

const API_BASE = "http://localhost:5000";

axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token") || localStorage.getItem("artAppToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ChatPage = () => {
  const { chatId, conversationId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [showOptionsForMessage, setShowOptionsForMessage] = useState(null);
  const activeChatId = chatId || conversationId;
  const [allConversations, setAllConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const socketRef = useRef();
  const messagesEndRef = useRef();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${API_BASE}${normalizedPath}`;
  };

  const getAvatarUrl = (username, size = 50) => {
    const name = username || 'مستخدم';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d5006d&color=fff&size=${size}&rounded=true`;
  };

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("artAppToken");
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return decoded.id;
      }
    } catch (e) {
      console.error("خطأ في فك التوكن:", e);
    }
    return localStorage.getItem("userId");
  };

  const currentUserId = getCurrentUserId();

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("artAppToken");
      await axios.delete(`${API_BASE}/api/chat/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(m => m._id !== messageId));
      setShowOptionsForMessage(null);
    } catch (error) {
      console.error("خطأ في حذف الرسالة:", error);
      alert("فشل حذف الرسالة");
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المحادثة؟")) return;
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("artAppToken");
      await axios.delete(`${API_BASE}/api/chat/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllConversations(prev => prev.filter(c => c._id !== conversationId));
    } catch (error) {
      console.error("خطأ في حذف المحادثة:", error);
      alert("❌ فشل حذف المحادثة");
    }
  };

 const handleImageSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
    return;
  }
  const formData = new FormData();
  formData.append('image', file);
  formData.append('conversationId', activeChatId);
  try {
    setSending(true);
    const token = localStorage.getItem("token") || localStorage.getItem("artAppToken");
    const res = await axios.post(`${API_BASE}/api/chat/send-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    
    const sentMessage = res.data.data;
    setMessages(prev => [...prev, sentMessage]);
    scrollToBottom();
    
    
    if (socketRef.current && socketRef.current.connected && otherUser?._id) {
      console.log("📡 إرسال صورة عبر socket للمستخدم:", otherUser._id);
      socketRef.current.emit('private-message', {
        recipientId: otherUser._id,
        content: sentMessage.content, 
        conversationId: activeChatId,
        messageType: 'image'
      });
    }
    
    
    setAllConversations(prev => prev.map(conv => 
      conv._id === activeChatId ? {
        ...conv,
        lastMessage: {
          _id: sentMessage._id,
          content: '🖼️ صورة',
          messageType: 'image',
          createdAt: sentMessage.createdAt
        },
        lastMessageAt: sentMessage.createdAt
      } : conv
    ));
    
  } catch (error) {
    console.error("خطأ في إرسال الصورة:", error);
    alert("فشل إرسال الصورة");
  } finally {
    setSending(false);
    e.target.value = '';
  }
};

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/chat/conversations`);
      setAllConversations(res.data.data || []);
    } catch (error) {
      console.error("خطأ في جلب المحادثات:", error);
    }
  };

const scrollToBottom = (behavior = "smooth", delay = 0) => {
  setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: behavior, 
      block: "end" 
    });
  }, delay);
};
useLayoutEffect(() => {
  if (!loading && messages.length > 0) {
    scrollToBottom("auto", 100);
  }
}, [loading, messages.length]);


useEffect(() => {
  const fetchMessages = async () => {
    if (!activeChatId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/chat/messages/${activeChatId}`);
      setMessages(res.data.data || []);
    } catch (error) {
      console.error("خطأ في جلب الرسائل:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchMessages();
}, [activeChatId]);

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  };

  const getImageUrls = (content) => {
    if (!content) return [];
    if (content.startsWith('/uploads/') || content.startsWith('http')) return [content];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    return [content];
  };

  const openGallery = (images, startIndex) => {
    setGalleryImages(images);
    setGalleryIndex(startIndex);
  };

  useEffect(() => {
    fetchConversations();
  }, []);
 
useEffect(() => {
  if (!loading && messages.length > 0) {
    scrollToBottom("auto"); 
  }
}, [loading, messages.length]);


useEffect(() => {
  const fetchConversation = async () => {
    if (!activeChatId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/chat/conversations`);
      const currentConv = res.data.data?.find(c => c._id === activeChatId);
      setConversation(currentConv);
    } catch (error) {
      console.error("خطأ في جلب المحادثة:", error);
    }
  };
  fetchConversation();
}, [activeChatId]);


useEffect(() => {
  const fetchMessages = async () => {
    if (!activeChatId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/chat/messages/${activeChatId}`);
      setMessages(res.data.data || []);
      scrollToBottom();
    } catch (error) {
      console.error("خطأ في جلب الرسائل:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchMessages();
}, [activeChatId]);


const handleSendMessage = async () => {
  if (!newMessage.trim() || sending || !activeChatId) return;
  
  
  if (!otherUser?._id) {
    console.error("❌ لا يوجد مستلم للرسالة");
    alert("حدث خطأ: لا يمكن تحديد المستلم");
    return;
  }
  
  setSending(true);
  const messageContent = newMessage;
  setNewMessage("");
  
  try {
    const res = await axios.post(`${API_BASE}/api/chat/send`, {
      conversationId: activeChatId,
      content: messageContent
    });
    
    const sentMessage = res.data.data;
    setMessages(prev => [...prev, sentMessage]);
    

    setAllConversations(prev => prev.map(conv => 
      conv._id === activeChatId ? {
        ...conv,
        lastMessage: {
          _id: sentMessage._id,
          content: sentMessage.content,
          messageType: sentMessage.messageType || 'text',
          createdAt: sentMessage.createdAt
        },
        lastMessageAt: sentMessage.createdAt
      } : conv
    ));
    

    if (socketRef.current && socketRef.current.connected) {
      console.log("📡 إرسال عبر socket للمستخدم:", otherUser._id);
      socketRef.current.emit('private-message', {
        recipientId: otherUser._id,
        content: messageContent,
        conversationId: activeChatId
      });
    } else {
      console.log("⚠️ Socket غير متصل، الرسالة محفوظة محلياً فقط");
    }
    
    scrollToBottom();
  } catch (error) {
    console.error("خطأ في إرسال الرسالة:", error);
    setNewMessage(messageContent);
  } finally {
    setSending(false);
  }
};

  const otherUser = conversation?.participants?.find(p => p?._id !== currentUserId);
  const isMyMessage = (messageSenderId) => messageSenderId === currentUserId;

  if (loading && activeChatId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl animate-pulse">💬</span>
            </div>
          </div>
          <p className="mt-6 text-gray-600 text-lg font-medium">جاري تحميل المحادثة...</p>
        </div>
      </div>
    );
  }

  if (!activeChatId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/profile/${currentUser?._id}`)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110 text-pink-600 hover:text-pink-700 border border-pink-100"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    المحادثات
                  </h1>
                  <p className="text-sm text-gray-500">تواصل مع الفنانين والمبدعين</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {allConversations.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 text-center border-2 border-pink-100 shadow-xl">
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative bg-white rounded-full p-8 shadow-2xl">
                  <span className="text-7xl">💬</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">لا توجد محادثات</h2>
              <p className="text-gray-500 text-lg mb-6">ابدأ محادثة جديدة من صفحة الفنان</p>
              <button
                onClick={() => navigate('/artists')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <span>🎨</span>
                <span>استعرض الفنانين</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allConversations.map((conv, index) => {
                const otherParticipant = conv.participants?.find(p => p?._id !== currentUserId);
                const otherUserName = otherParticipant?.username || "مستخدم";
                const otherUserImage = otherParticipant?.profilePicture;
                return (
                  <div
                    key={conv._id}
                    onClick={() => navigate(`/chat/${conv._id}`)}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-pink-100 hover:border-pink-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${index * 0.05}s forwards`,
                      opacity: 0,
                      transform: 'translateY(10px)'
                    }}
                  >
                    <style>{`
                      @keyframes fadeInUp {
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                    <div className="flex items-center gap-4">
                      <img
                        src={getImageUrl(otherUserImage) || getAvatarUrl(otherUserName, 50)}
                        onError={(e) => e.target.src = getAvatarUrl(otherUserName, 50)}
                        alt={otherUserName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-pink-200 shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800 text-lg truncate">{otherUserName}</h3>
                          {conv.unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full shadow-sm">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm truncate mt-1">
                          {conv.lastMessage?.messageType === 'image' ? (
                            <span className="flex items-center gap-1">
                              <span>🖼️</span>
                              <span>صورة</span>
                            </span>
                          ) : (
                            conv.lastMessage?.content || "لا توجد رسائل"
                          )}
                        </p>
                        {conv.lastMessageAt && (
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(conv.lastMessageAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv._id); }}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg hover:scale-110 text-red-500 hover:text-red-600 border border-red-200"
                        title="حذف المحادثة"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 opacity-5 text-9xl pointer-events-none select-none">💬</div>
        <div className="fixed top-20 right-0 opacity-5 text-9xl pointer-events-none select-none transform rotate-12">🎨</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/chat')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110 text-pink-600 hover:text-pink-700 border border-pink-100"
              >
                <ArrowLeft size={20} />
              </button>
              
              {conversation ? (
                <>
                  <img
                    src={getImageUrl(otherUser?.profilePicture) || getAvatarUrl(otherUser?.username, 40)}
                    onError={(e) => e.target.src = getAvatarUrl(otherUser?.username, 40)}
                    alt={otherUser?.username}
                    className="w-11 h-11 rounded-full object-cover border-2 border-pink-200 shadow-md"
                  />
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">{otherUser?.username || "المستخدم"}</h2>
                    <p className={`text-xs ${isTyping ? 'text-pink-500 animate-pulse' : 'text-green-500'}`}>
                      {isTyping ? "يكتب..." : "متصل"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl mb-4">
              <span className="text-5xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد رسائل بعد</h3>
            <p className="text-gray-500">أرسل أول رسالة لبدء المحادثة</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = isMyMessage(msg.sender?._id);
            const imageUrls = getImageUrls(msg.content);
            const isImageMessage = msg.messageType === 'image';

            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isOwn && (
                  <img
                    src={getImageUrl(msg.sender?.profilePicture) || getAvatarUrl(msg.sender?.username, 30)}
                    onError={(e) => e.target.src = getAvatarUrl(msg.sender?.username, 30)}
                    alt={msg.sender?.username}
                    className="w-8 h-8 rounded-full object-cover border border-pink-100 self-end mb-1"
                  />
                )}
                
                <div className="relative max-w-[70%]">
                  {isOwn && (
                    <div className="absolute -left-8 top-1">
                      <button
                        onClick={() => setShowOptionsForMessage(showOptionsForMessage === msg._id ? null : msg._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md text-gray-400 hover:text-pink-500 transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {showOptionsForMessage === msg._id && (
                        <div className="absolute top-8 left-0 bg-white rounded-xl shadow-xl border border-pink-100 z-10 min-w-[100px]">
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="w-full px-4 py-2 text-right text-red-500 hover:bg-pink-50 rounded-xl transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            <span className="text-sm">حذف</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isImageMessage ? (
                    <>
                      {imageUrls.length === 1 ? (
                        <img
                          src={getImageUrl(imageUrls[0])}
                          alt="صورة"
                          className="max-w-[220px] max-h-[220px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openGallery(imageUrls, 0)}
                        />
                      ) : (
                        <div className="relative cursor-pointer" onClick={() => openGallery(imageUrls, 0)}>
                          {imageUrls.slice(0, 4).map((url, idx) => (
                            <img
                              key={idx}
                              src={getImageUrl(url)}
                              alt={`صورة ${idx + 1}`}
                              className="max-w-[200px] max-h-[200px] rounded-xl object-cover"
                              style={{
                                position: idx === 0 ? 'relative' : 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 4 - idx,
                                opacity: 1 - (idx * 0.1),
                                transform: `translate(${idx * 6}px, ${idx * 6}px) rotate(${idx * 1.5}deg)`,
                                boxShadow: idx === 0 ? 'none' : '0 2px 6px rgba(0,0,0,0.15)'
                              }}
                            />
                          ))}
                          {imageUrls.length > 4 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-10">
                              +{imageUrls.length}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`text-xs mt-1 text-right ${isOwn ? 'text-pink-400' : 'text-gray-400'}`}>
                        {formatMessageTime(msg.createdAt)}
                      </div>
                    </>
                  ) : (
                    <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-tr-none' : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-pink-100 rounded-tl-none'}`}>
                      <p className="text-base whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                      <div className={`text-xs mt-1.5 ${isOwn ? 'text-pink-100' : 'text-gray-400'}`}>
                        {formatMessageTime(msg.createdAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex justify-start gap-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-pink-100 rounded-tl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white/80 backdrop-blur-md border-t border-pink-100 p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById('imageInput').click()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110 text-pink-600 hover:text-pink-700 border border-pink-100"
            title="إرسال صورة"
          >
            <ImageIcon size={20} />
          </button>
          <input type="file" id="imageInput" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اكتب رسالتك..."
            className="flex-1 px-5 py-3 bg-white/90 border border-pink-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 text-gray-700 placeholder-gray-400 text-base"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all hover:scale-110 ${!newMessage.trim() || sending ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg'}`}
          >
            {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
          </button>
        </div>
      </div>

      {galleryIndex !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center" onClick={() => setGalleryIndex(null)}>
          <button
            onClick={() => setGalleryIndex(null)}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all text-white z-10"
          >
            <X size={24} />
          </button>
          <img
            src={getImageUrl(galleryImages[galleryIndex])}
            alt={`صورة ${galleryIndex + 1}`}
            className="max-w-[90%] max-h-[85%] object-contain rounded-xl shadow-2xl cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-8 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {galleryIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 opacity-5 text-9xl pointer-events-none select-none">💬</div>
      <div className="fixed top-20 right-0 opacity-5 text-9xl pointer-events-none select-none transform rotate-12">🎨</div>
    </div>
  );
};

export default ChatPage;