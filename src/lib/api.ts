import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Send default dev token in header for unauthenticated dev calls without setting localStorage
        config.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID5eeJuMukPq-YAw22zBfeBDAZHAw_a-u-0W0l05Q`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
