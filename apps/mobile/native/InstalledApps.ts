import { NativeModules } from "react-native";

export type AppInfo = {
  appName: string;
  packageName: string;
  iconUri?: string | null;
  isSystemApp?: boolean;
};

const { InstalledApps } = NativeModules;

export async function getInstalledApps(): Promise<AppInfo[]> {
  if (!InstalledApps || typeof InstalledApps.getInstalledApps !== "function") {
    throw new Error("InstalledApps native module not found or invalid");
  }

  try {
    // Native module should return an array of objects
    const apps = await InstalledApps.getInstalledApps();
    if (!apps || !Array.isArray(apps)) return [];
    return apps as AppInfo[];
  } catch (err) {
    console.warn("getInstalledApps native call failed:", err);
    return [];
  }
}
