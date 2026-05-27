import axios, { AxiosError, AxiosResponse } from "axios";
import Constants from "expo-constants";

const TUNNEL_PATTERNS = ["ngrok-free.app", "ngrok.io", "ngrok.app"];

export function isTunnelUrl(url: string): boolean {
  return TUNNEL_PATTERNS.some((p) => url.includes(p));
}

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("TO_BE_DEFINED")) {
    return envUrl;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3000/api`;
  }

  return "http://10.0.2.2:3000/api";
}

const API_BASE_URL = resolveBaseUrl();

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(isTunnelUrl(API_BASE_URL) && {
      "ngrok-skip-browser-warning": "true",
    }),
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data?.error === true) {
      const message: string =
        response.data?.message ?? "Le serveur a retourné une erreur métier.";
      return Promise.reject(new Error(message));
    }
    return response;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);
