import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useAuthStore } from "./store/authStore";
import { ref as dbRef, get } from "firebase/database";
import { db } from "./lib/firebase";
import Index from "./pages/Index";
import ChatScreen from "./components/chat/ChatScreen";
import SettingsPage from "./components/settings/SettingsPage";
import PrivacySettings from "./components/settings/PrivacySettings";
import NotificationSettings from "./components/settings/NotificationSettings";
import ChatSettings from "./components/settings/ChatSettings";
import AppearanceSettings from "./components/settings/AppearanceSettings";
import StarredMessages from "./components/settings/StarredMessages";
import SecuritySettings from "./components/settings/SecuritySettings";
import ProfilePage from "./components/profile/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { login, logout, user } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user has profile data in database
          const userData = await get(dbRef(db, `users/${firebaseUser.uid}`));
          if (userData.exists()) {
            const userInfo = userData.val();
            // Only login if we don't already have a user logged in
            if (!user) {
              login({
                id: firebaseUser.uid,
                name: userInfo.name,
                email: firebaseUser.email || '',
                status: userInfo.status,
                photoURL: userInfo.photoURL,
              });
            }
          } else {
            // User exists in Firebase Auth but not in our database
            // Don't automatically login - let them complete profile setup
            console.log('User needs to complete profile setup');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Don't automatically login on error
        }
      } else {
        // User is signed out
        logout();
      }
    });

    return () => unsubscribe();
  }, [login, logout, user]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat/:id" element={<ChatScreen />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/privacy" element={<PrivacySettings />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/settings/chats" element={<ChatSettings />} />
            <Route path="/settings/appearance" element={<AppearanceSettings />} />
            <Route path="/settings/starred" element={<StarredMessages />} />
            <Route path="/settings/security" element={<SecuritySettings />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
