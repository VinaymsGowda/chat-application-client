import React from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Users,
  Lock,
  Globe,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { FeatureCard } from "../components/featureCard/FeatureCard";

function LandingPage() {
  const features = [
    {
      icon: <MessageSquare size={24} className="text-indigo-600" />,
      bgColor: "bg-indigo-100",
      title: "Real-time Messaging",
      description:
        "Send and receive messages instantly, with typing indicators and read receipts.",
    },
    {
      icon: <Users size={24} className="text-teal-600" />,
      bgColor: "bg-teal-100",
      title: "Group Conversations",
      description:
        "Create groups with friends, family, or colleagues to stay connected with everyone.",
    },
    {
      icon: <Lock size={24} className="text-pink-600" />,
      bgColor: "bg-pink-100",
      title: "Private & Secure",
      description:
        "Your conversations are protected with end-to-end encryption for maximum privacy.",
    },
    {
      icon: <Globe size={24} className="text-amber-600" />,
      bgColor: "bg-amber-100",
      title: "Cross-Platform",
      description:
        "Use ChatConnect on any device - your conversations sync seamlessly across all platforms.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-600"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polygon points="21 15 16 10 5 21"></polygon>
        </svg>
      ),
      bgColor: "bg-purple-100",
      title: "Rich Media Sharing",
      description:
        "Share photos, videos, documents, and other files with your contacts easily.",
    },
    {
      icon: <CheckCircle size={24} className="text-blue-600" />,
      bgColor: "bg-blue-100",
      title: "Status Updates",
      description:
        "See when your contacts are online and when they've read your messages.",
    },
  ];
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm py-4 px-6 sm:px-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white mr-3">
              <MessageSquare size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900">ChatConnect</span>
          </div>

          <div>
            <Link
              to="/auth"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative bg-white py-20">
        <div className="container mx-auto px-6 sm:px-12 flex flex-col gap-3 md:flex-row items-center justify-between">
          {/* Left: Text Content */}
          <div className="w-full md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Bringing the world <span className="text-indigo-600">closer</span>{" "}
              through seamless conversations.
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Discover a new way to stay connected. ChatConnect lets you
              experience real-time messaging, global reach, and immersive group
              interactions like never before.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/auth"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-transform hover:-translate-y-1"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-indigo-600 font-semibold rounded-xl shadow-md transition-transform hover:-translate-y-1"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Right: Animated Visual */}
          <div className="w-full md:w-1/2 md:mb-0 relative">
            <div className="relative w-full max-w-md mx-auto">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/cf/A_large_blank_world_map_with_oceans_marked_in_blue.PNG"
                alt="Global Network"
                className="rounded-2xl shadow-lg object-cover w-full h-[360px] opacity-90"
              />
              <div className="absolute inset-0 animate-pulse-slow pointer-events-none">
                {/* Floating Avatars */}
                <div className="absolute top-10 left-10 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-indigo-500">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="User"
                    className="rounded-full"
                  />
                </div>
                <div className="absolute top-24 right-12 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-pink-500">
                  <img
                    src="https://randomuser.me/api/portraits/men/22.jpg"
                    alt="User"
                    className="rounded-full"
                  />
                </div>
                <div className="absolute bottom-10 left-20 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-yellow-500">
                  <img
                    src="https://randomuser.me/api/portraits/women/65.jpg"
                    alt="User"
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-6 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Designed for Connection
            </h2>
            <p className="text-gray-600">
              Our platform is built with features that make communication
              effortless and enjoyable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <FeatureCard
                key={idx}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                bgColor={feature.bgColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-indigo-700 py-16">
        <div className="container mx-auto px-6 sm:px-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to get connected?
          </h2>
          <p className="text-indigo-100 max-w-2xl mx-auto mb-8">
            Join thousands of users already enjoying ChatConnect's seamless
            messaging experience.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Start Chatting <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6 sm:px-10">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white mr-3">
                  <MessageSquare size={24} />
                </div>
                <span className="text-xl font-bold text-white">
                  ChatConnect
                </span>
              </div>
              <p className="mt-4 max-w-xs">
                Connect with anyone, anywhere in the world with our secure
                messaging platform.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; 2025 ChatConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
