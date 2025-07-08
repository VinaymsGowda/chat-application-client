# 💬 ChatConnect - Modern Chat App Client

Welcome to **ChatConnect**! This is a modern, feature-rich chat application client built with React, designed for seamless real-time communication and a beautiful user experience.

---

## 🚀 Features

- **One-to-One, Group, and Self Chats**: Effortlessly chat with individuals, groups, or even yourself for notes and reminders.
- **User Authentication**: Secure signup/login with email & Google.
- **Profile Management**: Update your profile and view others' details.
- **Group Management**: Create groups, add/remove members, rename groups, and leave groups. **Admins can add new people or remove anyone from the group.**
- **Real-Time Messaging**: Instant message delivery with Socket.IO.
- **Responsive UI**: Fully optimized for mobile and desktop.
- **Search & Filter**: Quickly find users and group members.
- **Modern UI/UX**: Clean, intuitive, and accessible design.

---

## 🛠️ Tech Stack & Libraries

- **React 19** – UI library
- **Redux Toolkit** – State management
- **Redux Persist** – State persistence
- **React Router v7** – Routing
- **Tailwind CSS** – Utility-first CSS framework
- **Socket.IO Client** – Real-time communication
- **Axios** – HTTP requests
- **Firebase Auth** – Authentication (email & Google)
- **Lucide React** – Icon library
- **Radix UI** – Accessible UI primitives (dialogs, tooltips, etc.)
- **Vite** – Lightning-fast build tool

---

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/chat-app-client.git
cd chat-app-client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add your Firebase and server config:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
VITE_SERVER_URL=http://localhost:5000
```

### 4. Start the development server

```bash
npm run dev
```

The app will be running at [http://localhost:5173](http://localhost:5173)

---

## 🤝 Contributing

Contributions are welcome! Please open issues and submit pull requests for new features, bug fixes, or improvements.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> _Made with ❤️ by the ChatConnect Team_
