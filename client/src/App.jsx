import {Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import LoginPage from './Pages/LoginPage';
import ProfilePage from './Pages/ProfilePage';
import Explore from "./Pages/Explore";
import ArtworkDetail from "./Pages/ArtworkDetail";
import AddArtwork from './Components/AddArtwork';
import EditArtwork from './Components/EditArtwork';
import Register from './Components/Register';
import Login from './Components/Login';
import AdminDashboard from './Pages/admin/AdminDashboard';
import ALogin from './Pages/admin/ALogin';
import ArtistsPage from './Pages/ArtistsPage';
import Events from "./Pages/EventPage";
import CreateEvent from "./Components/CreateEvent";
import MyTickets from "./Pages/MyTickets";
import AdminNotificationsPage from './Pages/admin/AdminNotificationsPage';
import Notifications from "./Components/Notifications"
import SuperAdminDashboard from './Pages/admin/SuperAdminDashboard';
import ScanTicket from './Pages/ScanTicket'
import { WalletProvider } from './context/WalletContext';
import { ArtworkProvider } from './context/ArtworkContext'; 
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import ChatPage from './Pages/ChatPage';
function App() {
  return (
      
     <AuthProvider>
     <WalletProvider>
    <ArtworkProvider>
    <ChatProvider>
    <ThemeProvider>
    <Routes>

      <Route path="/" element={<Home />} />
      <Route path="auth" element={<LoginPage />} />
      <Route path='/admin/login' element={<ALogin/>} />
      <Route path='/admin/dashboard' element={<AdminDashboard/>} />
      <Route path='/admin/super-dashboard' element={<SuperAdminDashboard />} />
      <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
      <Route path="/profile/:id" element={<ProfilePage />} />  
      <Route path="/explore" element={<Explore />} />
      <Route path="/artwork/:id" element={<ArtworkDetail />} />
      <Route path="/scan-ticket" element={<ScanTicket />} />
      <Route path="/add-artwork" element={<AddArtwork />} />
      <Route path="/edit-artwork/:id" element={<EditArtwork />} />
      <Route path="/artists" element={<ArtistsPage />} />
      <Route path="/events" element={<Events />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/events/create" element={<CreateEvent />} />
      <Route path="/my-bookings" element={<MyTickets />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:conversationId" element={<ChatPage />} />
    </Routes>
    </ThemeProvider>
   </ChatProvider>
     </ArtworkProvider>
      </WalletProvider>
     </AuthProvider>
    
  );
}

export default App;