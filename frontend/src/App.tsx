import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/login.page";
import SignupPage from "./pages/signup.page";
import ProtectedRoute from "./util/auth.wrapper";
import HomePage from "./pages/home.page";
import AuthCallbackPage from "./pages/auth-callback.page";
import SetupProfilePage from "./pages/setup-profile.page";
import CollectionPage from "./pages/collection.page";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/setup-profile" element={<SetupProfilePage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collections/:collectionId"
          element={
            <ProtectedRoute>
              <CollectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
