declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT?: string;
      VITE_PORT?: string;
      VITE_API_URL?: string;
      PWD: string;
    }
  }
}
export {};
