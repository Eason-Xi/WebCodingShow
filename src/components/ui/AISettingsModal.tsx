"use client";

import { useEffect, useState } from "react";
import {
  Settings2,
  X,
  Key,
  Globe,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import {
  getAISettings,
  saveAISettings,
  clearAISettings,
  DEFAULT_PRESETS,
  SETTINGS_CHANGE_EVENT,
  type AISettings,
} from "@/lib/client-settings";
import { toast } from "@/components/ui/Feedback";

export default function AISettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  const loadSettings = () => {
    const s = getAISettings();
    setApiKey(s.apiKey);
    setBaseUrl(s.baseUrl);
    setModel(s.model);
    setHasCustomKey(Boolean(s.apiKey));
  };

  useEffect(() => {
    loadSettings();
    const handleSync = () => loadSettings();
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSync);
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSync);
  }, []);

  const handleApplyPreset = (presetKey: keyof typeof DEFAULT_PRESETS) => {
    const p = DEFAULT_PRESETS[presetKey];
    setBaseUrl(p.baseUrl);
    setModel(p.model);
    toast.info(`已应用 ${p.label} 模板`, "请在上方填入您的专属 API Key 即可。");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAISettings({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim(),
    });
    setHasCustomKey(Boolean(apiKey.trim()));
    toast.success("AI 配置已保存", apiKey.trim() ? "已成功切换至您的自定义模型服务" : "已恢复为服务端系统默认 DeepSeek 服务");
    setIsOpen(false);
  };

  const handleReset = () => {
    clearAISettings();
    setApiKey("");
    setBaseUrl("");
    setModel("");
    setHasCustomKey(false);
    toast.info("已重置", "已恢复为服务端系统内置的官方 DeepSeek 服务。");
    setIsOpen(false);
  };

  const handleTestConnection = async () => {
    const targetKey = apiKey.trim();
    if (!targetKey) {
      toast.error("未输入 API Key", "请先输入 API Key 再进行连通性测试。");
      return;
    }
    const targetBaseUrl = baseUrl.trim() || "https://api.openai.com/v1";
    const targetModel = model.trim() || "deepseek-chat";

    setTesting(true);
    try {
      const cleanUrl = targetBaseUrl.replace(/\/+$/, "");
      const startTime = performance.now();
      const res = await fetch(`${cleanUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${targetKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[${res.status}] ${errText.slice(0, 100)}`);
      }
      toast.success("连接测试成功！", `模型 ${targetModel} 响应正常，耗时 ${elapsed}ms`);
    } catch (e: any) {
      toast.error("测试失败", e.message || "无法连接到该 AI 接口，请检查 URL 和 Key 是否有效");
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => {
          loadSettings();
          setIsOpen(true);
        }}
        className={clsx(
          "relative flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all duration-200",
          hasCustomKey
            ? "border-lime-500/40 bg-lime-500/10 text-lime-400 hover:bg-lime-500/20"
            : "border-line-2 bg-surface-2 text-2 hover:border-line-3 hover:text-1"
        )}
        title="配置自定义大模型 API"
      >
        <Settings2 className="h-4 w-4" />
        <span className="hidden sm:inline">
          {hasCustomKey ? "自定义 AI" : "AI 设置"}
        </span>
        {hasCustomKey ? (
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
        )}
      </button>

      {/* 弹窗模态框 */}
      {isOpen && (
        <div
          className="animate-fade fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="glass-panel animate-scale-in relative w-full max-w-lg rounded-2xl border border-line-2 bg-[color:var(--surface-1)] p-6 shadow-2xl">
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between border-b border-line-1 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-line-2 bg-surface-2 text-lime-400">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-1">
                    AI 大模型接入配置
                  </h3>
                  <p className="text-xs text-3">
                    支持自定义模型密钥（BYOK）或使用系统默认 DeepSeek
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-3 hover:bg-surface-2 hover:text-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 快捷模板 */}
            <div className="mt-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-3">
                一键应用常用预设
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(DEFAULT_PRESETS) as Array<keyof typeof DEFAULT_PRESETS>).map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      className="rounded-lg border border-line-1 bg-surface-2 px-2.5 py-1.5 text-left text-xs text-2 hover:border-lime-500/40 hover:text-1 transition-all"
                    >
                      <div className="font-medium truncate">{DEFAULT_PRESETS[key].label}</div>
                      <div className="text-[10px] text-3 truncate font-mono">
                        {DEFAULT_PRESETS[key].model}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSave} className="mt-5 space-y-4">
              {/* API Key */}
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-2">
                  <span className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-3" />
                    API Key（密钥）
                  </span>
                  <span className="text-[11px] text-3">
                    留空则默认使用服务端内置 DeepSeek
                  </span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="input w-full pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-3 hover:text-1 transition-colors"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Base URL */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-2">
                  <Globe className="h-3.5 w-3.5 text-3" />
                  API Base URL（接口根地址）
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.deepseek.com 或 https://api.openai.com/v1"
                  className="input mt-1.5 w-full font-mono text-xs"
                />
              </div>

              {/* Model */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-2">
                  <Cpu className="h-3.5 w-3.5 text-3" />
                  Model（模型名称）
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="deepseek-chat 或 gpt-4o-mini"
                  className="input mt-1.5 w-full font-mono text-xs"
                />
              </div>

              {/* 当前状态提示 */}
              <div className="rounded-xl border border-line-1 bg-surface-2 p-3 text-xs leading-relaxed text-3">
                <div className="flex items-center gap-2 font-medium text-2">
                  {hasCustomKey ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-lime-400" />
                      当前状态：已启用自定义专属 API 密钥
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      当前状态：使用系统默认 DeepSeek 官方接口
                    </>
                  )}
                </div>
                <p className="mt-1 text-[11px]">
                  自定义密钥仅保存在您当前浏览器的本地存储中，不会同步到任何公开仓库，安全无虞。
                </p>
              </div>

              {/* 底部按钮栏 */}
              <div className="flex items-center justify-between border-t border-line-1 pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !apiKey.trim()}
                    className="btn btn-secondary btn-sm text-xs"
                  >
                    {testing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "测试连接"
                    )}
                  </button>
                  {hasCustomKey && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn btn-ghost btn-sm text-xs text-3 hover:text-1"
                      title="重置为系统默认"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      恢复默认
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    保存生效
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
