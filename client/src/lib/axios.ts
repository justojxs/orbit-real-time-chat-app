import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies cross-origin (needed for refresh tokens)
    timeout: 15000, // 15s timeout — fail fast instead of hanging forever
});

// Response interceptor: auto-refresh expired tokens without user intervention
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If we get a 401 and haven't retried yet, try refreshing the token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axios.post(
                    `${API_URL}/api/user/refresh`,
                    {},
                    { withCredentials: true }
                );

                // Update token in localStorage
                const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
                if (userInfo) {
                    userInfo.token = data.token;
                    localStorage.setItem("userInfo", JSON.stringify(userInfo));
                }

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — clear session and redirect to login
                localStorage.removeItem("userInfo");
                window.location.href = "/";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
