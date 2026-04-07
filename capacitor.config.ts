import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.quickmart.sasaram",
  appName: "QuickMart",
  webDir: "www",
  bundledWebRuntime: false,
  server: {
    // For production build use your hosted HTTPS frontend URL.
    // url: "https://quickmart.yourdomain.com",
    androidScheme: "https"
  }
};

export default config;
