import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import { AuthPage } from "../pages/Auth/AuthPage";

import ProfilePage from "../pages/Profile/ProfilePage";
import ProtectedRoutes from "./ProtectedRoutes";
import PublicRoutes from "./PublicRoutes";
import ChatNavigation from "./ChatNavigation";

function Navigation() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<PublicRoutes element={<AuthPage />} />} />
        {/* 
        <Route
          path="/chat"
          element={<ProtectedRoutes element={<ChatPage />} />}
        /> */}
        <Route
          path="/chat/*"
          element={<ProtectedRoutes element={<ChatNavigation />} />}
        />
        <Route
          path="/profile"
          element={<ProtectedRoutes element={<ProfilePage />} />}
        />
        <Route path="*" element={<h1>Page not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default Navigation;
