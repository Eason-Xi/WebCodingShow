export interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = "ai_interview_custom_settings_v1";
export const SETTINGS_CHANGE_EVENT = "ai-interview-settings-changed";

export const DEFAULT_PRESETS = {
  deepseek: {
    label: "DeepSeek 官方",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
  },
  openai: {
    label: "OpenAI 官方",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  kimi: {
    label: "Moonshot (Kimi)",
    baseUrl: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
  },
  siliconflow: {
    label: "硅基流动 (SiliconFlow)",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "deepseek-ai/DeepSeek-V3",
  },
} as const;

export function getAISettings(): AISettings {
  if (typeof window === "undefined") {
    return { apiKey: "", baseUrl: "", model: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { apiKey: "", baseUrl: "", model: "" };
    const parsed = JSON.parse(raw);
    return {
      apiKey: (parsed.apiKey || "").trim(),
      baseUrl: (parsed.baseUrl || "").trim(),
      model: (parsed.model || "").trim(),
    };
  } catch {
    return { apiKey: "", baseUrl: "", model: "" };
  }
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
  } catch (e) {
    console.error("Failed to save AI settings to localStorage", e);
  }
}

export function clearAISettings(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: null }));
  } catch (e) {
    console.error("Failed to clear AI settings from localStorage", e);
  }
}

export function getAIHeaders(): Record<string, string> {
  const settings = getAISettings();
  const headers: Record<string, string> = {};
  if (settings.apiKey) {
    headers["x-api-key"] = settings.apiKey;
  }
  if (settings.baseUrl) {
    headers["x-base-url"] = settings.baseUrl;
  }
  if (settings.model) {
    headers["x-model"] = settings.model;
  }
  return headers;
}

const LOCAL_PROJECTS_KEY = "ai_interview_local_projects_mirror_v1";

export function getLocalProjectsMirror(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalProjectsMirror(projects: any[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn("Failed to update local projects mirror", e);
  }
}

export function syncProjectToLocalMirror(project: any): void {
  if (typeof window === "undefined" || !project || !project.id) return;
  const list = getLocalProjectsMirror();
  const next = [project, ...list.filter((p: any) => p.id !== project.id)];
  saveLocalProjectsMirror(next);
}

