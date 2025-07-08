import React, { useState } from "react";
import { User, Mail, Lock, AlertCircle } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { createUser, handleGooogleAuth } from "../../services/userService";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  clearError,
  setLoading,
  setUser,
  setError,
} from "../../redux/features/Auth/User";
import { useToast } from "../../App";

const SignupForm = ({ onToggleForm }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    dispatch(clearError());
    dispatch(setLoading(true));

    // Validate passwords match
    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      setValidationError(errorMsg);
      dispatch(setError(errorMsg));
      return;
    }

    // Validate password length
    if (password.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      setValidationError(errorMsg);
      dispatch(setError(errorMsg));
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const response = await createUser({
        name: name,
        email: email,
        authProviderId: userCredential.user.uid,
        profileURL: userCredential.user.photoURL || "",
      });
      if (response.status === 201) {
        await updateProfile(userCredential.user, { displayName: name });
        dispatch(setUser(response.data.data));
        const token = await userCredential.user.getIdToken();
        localStorage.setItem("token", token);
        showToast({
          title: "Signup Success",
          description: "Account created successfully!",
        });
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        navigate("/chat");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to create account.";
      setValidationError(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  // Google sign in handler
  const handleGoogleSignIn = async () => {
    setValidationError("");
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
      if (res.status === 200) {
        dispatch(setUser(res.data.data));
      }

      const token = await response.user.getIdToken();
      localStorage.setItem("token", token);
      showToast({
        title: "Signup Success",
        description: "Account created successfully!",
      });
      navigate("/chat");
    } catch (error) {
      const errorMessage = error.message || "Google sign in failed.";
      setValidationError(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">
        Create account
      </h2>

      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <p>{validationError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full name
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <User size={18} />
            </div>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm password
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <Lock size={18} />
            </div>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating account..." : "Create account"}
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
          Sign up with Google
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onToggleForm}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
