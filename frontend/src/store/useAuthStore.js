import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/"; 

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('/auth/check');
            set({ authUser: res.data.user })
            get().connectSocket();
        } catch (error) {
            console.log("checkAuth error", error)
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post('/auth/signup', data);
            set({ authUser: res.data });

            toast.success("Account created successfully");

            get().connectSocket();
        } catch (error) {
            console.log("signup error", error);
            toast.error(error?.response?.data?.message);
        } finally {
            set({ isSigningUp: false })
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("auth/logout");
            set({ authUser: null });

            toast.success("Logged out successfully");

            get().dissConnectSocket();
        } catch (error) {
            console.log("logout error", error);
            toast.error(error?.response?.data?.message);
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post('/auth/login', data);
            console.log("🚀 ~ login: ~ re̥s:", res)
            set({ authUser: res.data.userData });

            toast.success("Logged in successfully");

            get().connectSocket();

        } catch (error) {
            console.log("login error", error);
            toast.error(error?.response?.data?.message);
        } finally {
            set({ isLoggingIn: false })
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true })
        try {
            const res = await axiosInstance.put('/auth/update-profile', data);
            console.log("🚀 ~ login: ~ re̥s:", res)
            // set({ authUser: res.data.userData });

            toast.success("Profile update successfully");
        } catch (error) {
            console.log("updateProfile error", error);
            toast.error(error?.response?.data?.message);
        } finally {
            set({ isUpdatingProfile: false })
        }
    },

    connectSocket: () => {
        const { authUser } = get();

        if (!authUser || get().socket?.connected) return;

        console.log("connect to socket server")
        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            }
        });
        socket.connect();

        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({onlineUsers: userIds});
        });
    },

    dissConnectSocket: () => {
        if (get().socket?.connected) {
            get().socket.disconnect();
        }
    },
}))