import React, { useState } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import {
  handleGooogleAuth,
  fetchUserByAuthProviderId,
} from "../../services/userService";
import { useDispatch } from "react-redux";
import {
  clearError,
  setLoading,
  setUser,
  setError,
} from "../../redux/features/Auth/User";
import { useToast } from "../../context/ToastContext";

const LoginForm = ({ onToggleForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    dispatch(setLoading(true));
    dispatch(clearError());
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      // Optionally redirect or show success
      if (response.user) {
        showToast({
          title: "Login Success",
          description: "Signed in successfully!",
        });
        const token = await response.user.getIdToken();
        localStorage.setItem("token", token);
        setEmail("");
        setPassword("");
        // Fetch user details and set in Redux
        try {
          const userRes = await fetchUserByAuthProviderId(response.user.uid);
          if (userRes.status === 200) {
            dispatch(setUser(userRes.data.data));
          }
        } catch (err) {
          // Optionally handle error
        }
        navigate("/chat");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to sign in.";
      setErrorMsg(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  // Google sign in handler
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setIsLoading(true);
    dispatch(setLoading(true));
    dispatch(clearError());

    const provider = new GoogleAuthProvider();
    try {
      const response = await signInWithPopup(auth, provider);

      const userData = {
        name: response.user.displayName,
        authProviderId: response.user.uid,
        email: response.user.email,
        profileURL: response.user.photoURL,
      };

      const res = await handleGooogleAuth(userData);
      if (res.status === 200 || res.status === 201) {
        dispatch(setUser(res.data.data));
      }

      // Set user data in Redux store

      const token = await response.user.getIdToken();
      localStorage.setItem("token", token);

      showToast({
        title: "Login Success",
        description: "Signed in successfully!",
      });
      navigate("/chat");
      // Optionally redirect or show success
    } catch (error) {
      const errorMessage = error.message || "Google sign in failed.";
      setErrorMsg(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">
        Welcome back
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <Lock size={18} />
            </div>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center text-red-600 text-sm mt-2">
            <AlertCircle size={16} className="mr-2" />
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onToggleForm}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Sign up
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-4">
          For demo: use email 'user@example.com' and password 'password123'
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
