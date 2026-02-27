import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { getModelInfo } from "../pages/DashboardUtils"; // Adjust path if needed
import { askAIQuestion, createTransaction, getCategories, getShoppingState, saveShoppingState } from "../api";
import {
  AlertCircle,
  Bot,
  Check,
  Edit,
  ExternalLink,
  Flame,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Trash2,
  X,
  TrendingDown,
  Calendar,
  DollarSign,
  Upload,
  BarChart3,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Card, Button } from "../components/UI";

const INVENTORY_KEY = "shopping_inventory_items_v1";
const SHOPPING_KEY = "shopping_list_items_v1";
const SHOPPING_AI_INSIGHTS_KEY = "shopping_ai_insights_v2";
const PRICE_HISTORY_KEY = "shopping_price_history_v1";

const CATEGORIES = ["Food", "Household", "Personal Care", "Electronics", "Wishlist", "Other"];
const UNITS = ["g", "kg", "ml", "L", "pieces", "packs", "boxes", "tubes", "bottles"];
const PRIORITIES = ["High", "Medium", "Low"];

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const formatEGP = (n) =>
  (n || 0).toLocaleString("en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });

const getStatus = (item) => {
  const qty = toNumber(item.quantity, 0);
  const low = toNumber(item.lowThreshold, 0);
  if (qty <= 0) return "out";
  if (low > 0 && qty <= low) return "low";
  return "ok";
};

const getDefaultRestockQty = (unit) => {
  if (unit === "g" || unit === "ml") return 1000;
  if (unit === "kg" || unit === "L") return 1;
  return 1;
};

const EMPTY_FORM = {
  id: "",
  mode: "inventory",
  name: "",
  category: "Food",
  quantity: 1,
  unit: "pieces",
  lowThreshold: 0,
  priceEstimate: "",
  link: "",
  priority: "Medium",
  priceHistory: [],
};

// Price history tracking helpers
const addPriceHistory = (item, newPrice) => {
  const history = item.priceHistory || [];
  return {
    ...item,
    priceHistory: [
      ...history,
      { price: newPrice, date: new Date().toISOString() }
    ].slice(-12) // Keep last 12 prices
  };
};

const getAveragePriceHistory = (item) => {
  const history = item.priceHistory || [];
  if (history.length === 0) return item.priceEstimate || 0;
  const sum = history.reduce((acc, h) => acc + (h.price || 0), 0);
  return Math.round((sum / history.length) * 100) / 100;
};

const getPriceChange = (item) => {
  const history = item.priceHistory || [];
  if (history.length < 2) return 0;
  const oldPrice = history[0].price;
  const newPrice = history[history.length - 1].price;
  return newPrice - oldPrice;
};

function ReceiptUploadModal({ open, isDark, onClose, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/ocr/upload-receipt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        onUploadSuccess(data.extracted_data);
        onClose();
      } else {
        setError(data.error || "Failed to process receipt");
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className={`absolute inset-0 ${isDark ? "bg-slate-950/85" : "bg-slate-900/65"} backdrop-blur-sm`}
        onClick={onClose}
      />
      <div className="relative h-full flex items-center justify-center p-3 md:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-3xl border overflow-hidden shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className={`px-5 md:px-7 py-4 border-b flex items-center justify-between ${isDark ? "border-slate-700" : "border-slate-200"}`}>
            <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>Upload Receipt</h3>
            <Button
              variant="secondary"
              onClick={onClose}
              className={`!p-2 !rounded-xl ${isDark ? "hover:!bg-slate-800 !text-slate-400" : "hover:!bg-slate-100 !text-slate-500"}`}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-5 md:p-7 space-y-4">
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Upload a receipt photo to automatically extract item details
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                isDark
                  ? "border-slate-600 hover:border-emerald-500 hover:bg-slate-800/50"
                  : "border-slate-300 hover:border-emerald-600 hover:bg-slate-50"
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                Click to upload or drag & drop
              </p>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                PNG, JPG, WebP up to 10MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {error && (
              <div className={`p-3 rounded-lg ${isDark ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"}`}>
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={uploading}
                className={`flex-1 !py-3 !rounded-2xl !text-xs !font-black !uppercase ${
                  isDark ? "!bg-slate-800 !text-slate-300" : "!bg-slate-100 !text-slate-700"
                }`}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ItemModal({ open, initial, isDark, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initial || EMPTY_FORM);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isShopping = form.mode === "shopping";

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className={`absolute inset-0 ${isDark ? "bg-slate-950/85" : "bg-slate-900/65"} backdrop-blur-sm`}
        onClick={onClose}
      />
      <div className="relative h-full flex items-center justify-center p-3 md:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className={`px-5 md:px-7 py-4 border-b flex items-center justify-between ${isDark ? "border-slate-700" : "border-slate-200"}`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Shopping & Inventory</p>
              <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>{form.id ? "Edit Item" : "Quick Add"}</h3>
            </div>
            <Button
              variant="secondary"
              onClick={onClose}
              className={`!p-2 !rounded-xl ${isDark ? "hover:!bg-slate-800 !text-slate-400" : "hover:!bg-slate-100 !text-slate-500"}`}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="p-5 md:p-7 space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl border border-slate-400/20">
              {["inventory", "shopping"].map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, mode }))}
                  className={`!py-2.5 !rounded-xl !text-xs !font-black !uppercase !tracking-widest !transition-all ${
                    form.mode === mode
                      ? "!bg-emerald-600 !text-white !shadow-lg !shadow-emerald-600/20"
                      : isDark ? "!text-slate-400 hover:!bg-slate-800" : "!text-slate-600 hover:!bg-slate-100"
                  }`}
                >
                  {mode === "inventory" ? "Inventory" : "Shopping"}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Item Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600"}`}
                  placeholder="Sugar, Toothpaste, Headphones..."
                />
              </div>

              <div>
                <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Category</label>
                <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Unit</label>
                <select value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isShopping ? "Quantity To Buy" : "Current Stock"}</label>
                <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
              </div>

              <div>
                <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Low Threshold</label>
                <input type="number" min="0" step="0.01" value={form.lowThreshold} onChange={(e) => setForm((s) => ({ ...s, lowThreshold: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
              </div>
            </div>

            {isShopping && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Price Estimate (EGP)</label>
                  <input type="number" min="0" step="0.01" value={form.priceEstimate} onChange={(e) => setForm((s) => ({ ...s, priceEstimate: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                </div>
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Store/Link</label>
                  <input value={form.link} onChange={(e) => setForm((s) => ({ ...s, link: e.target.value }))} placeholder="https://amazon.com/..." className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={onClose}
                className={`!flex-1 !py-3 !rounded-2xl !text-xs !font-black !uppercase !tracking-wider ${isDark ? "!bg-slate-800 !text-slate-300 hover:!bg-slate-700" : "!bg-slate-100 !text-slate-700 hover:!bg-slate-200"}`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="!flex-1 !py-3 !rounded-2xl !text-xs !font-black !uppercase !tracking-wider !bg-emerald-600 !text-white hover:!bg-emerald-700"
              >
                Save Item
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Shopping() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState("inventory");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(EMPTY_FORM);
  const [activeCategory, setActiveCategory] = useState("All");
  const [pulseTotal, setPulseTotal] = useState(false);
  const [showInsightsCard, setShowInsightsCard] = useState(false);
  const [aiShoppingInsights, setAiShoppingInsights] = useState("");
  const [shoppingInsightsLoading, setShoppingInsightsLoading] = useState(false);
  const [shoppingModelUsed, setShoppingModelUsed] = useState(null);
  const [currentTryingShoppingModel, setCurrentTryingShoppingModel] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [buyConfirmOpen, setBuyConfirmOpen] = useState(false);
  const [buyConfirmItem, setBuyConfirmItem] = useState(null);
  const [buyConfirmSubmitting, setBuyConfirmSubmitting] = useState(false);
  const [buyConfirmForm, setBuyConfirmForm] = useState({
    createTransaction: true,
    categoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [receiptUploadOpen, setReceiptUploadOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState({});
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const hasHydratedStorage = useRef(false);

  // Load from localStorage
  useEffect(() => {
    const loadShoppingData = async () => {
      const token = localStorage.getItem("token");
      const rawInventory = localStorage.getItem(INVENTORY_KEY);
      const rawShopping = localStorage.getItem(SHOPPING_KEY);

      const loadFromLocal = () => {
        if (rawInventory) {
          try { setInventoryItems(JSON.parse(rawInventory)); } catch { setInventoryItems([]); }
        }
        if (rawShopping) {
          try { setShoppingItems(JSON.parse(rawShopping)); } catch { setShoppingItems([]); }
        }
      };

      if (!token) {
        loadFromLocal();
        hasHydratedStorage.current = true;
        return;
      }

      try {
        const remote = await getShoppingState();
        const inventory = Array.isArray(remote?.inventory_items) ? remote.inventory_items : [];
        const shopping = Array.isArray(remote?.shopping_items) ? remote.shopping_items : [];
        setInventoryItems(inventory);
        setShoppingItems(shopping);
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
        localStorage.setItem(SHOPPING_KEY, JSON.stringify(shopping));
      } catch {
        loadFromLocal();
      } finally {
        hasHydratedStorage.current = true;
      }
    };

    loadShoppingData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getCategories()
      .then((cats) => {
        const expenseOnly = (cats || []).filter((c) => c?.type === "expense");
        setExpenseCategories(expenseOnly);
      })
      .catch(() => {
        setExpenseCategories([]);
      });
  }, []);

  // Save locally and sync to backend (authenticated users)
  useEffect(() => {
    if (!hasHydratedStorage.current) return;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventoryItems));
    const token = localStorage.getItem("token");
    if (token) {
      saveShoppingState(inventoryItems, shoppingItems).catch(() => {
        // Keep local state as fallback when backend sync fails.
      });
    }
  }, [inventoryItems]);

  useEffect(() => {
    if (!hasHydratedStorage.current) return;
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingItems));
    const token = localStorage.getItem("token");
    if (token) {
      saveShoppingState(inventoryItems, shoppingItems).catch(() => {
        // Keep local state as fallback when backend sync fails.
      });
    }
  }, [shoppingItems]);

  const shoppingTotal = useMemo(
    () => shoppingItems.reduce((sum, item) => sum + toNumber(item.priceEstimate, 0) * toNumber(item.quantity, 0), 0),
    [shoppingItems]
  );

  // **Feature 9: Category-based Shopping Totals**
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    shoppingItems.forEach((item) => {
      const cat = item.category || "Other";
      if (!breakdown[cat]) breakdown[cat] = { total: 0, count: 0 };
      breakdown[cat].total += toNumber(item.priceEstimate, 0) * toNumber(item.quantity, 0);
      breakdown[cat].count += 1;
    });
    return Object.entries(breakdown).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      percent: (data.total / (shoppingTotal || 1)) * 100,
    })).sort((a, b) => b.total - a.total);
  }, [shoppingItems, shoppingTotal]);

  const lowCount = useMemo(() => inventoryItems.filter((i) => getStatus(i) === "low").length, [inventoryItems]);
  const outCount = useMemo(() => inventoryItems.filter((i) => getStatus(i) === "out").length, [inventoryItems]);

  // Sort inventory: out → low → ok, then alphabetical
  const sortedInventoryItems = useMemo(() => {
    const statusRank = { out: 0, low: 1, ok: 2 };
    return [...inventoryItems].sort((a, b) => {
      const statusDiff = statusRank[getStatus(a)] - statusRank[getStatus(b)];
      if (statusDiff !== 0) return statusDiff;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
  }, [inventoryItems]);

  // Filter by category
  const filteredInventoryItems = useMemo(
    () =>
      sortedInventoryItems.filter((item) =>
        activeCategory === "All" ? true : item.category === activeCategory
      ),
    [sortedInventoryItems, activeCategory]
  );

  const filteredShoppingItems = useMemo(
    () =>
      shoppingItems.filter((item) =>
        activeCategory === "All" ? true : item.category === activeCategory
      ),
    [shoppingItems, activeCategory]
  );

  // Pulse total when it changes
  useEffect(() => {
    if (shoppingTotal <= 0) return;
    setPulseTotal(true);
    const t = setTimeout(() => setPulseTotal(false), 2000);
    return () => clearTimeout(t);
  }, [shoppingTotal]);

  // AI Insights logic (multi-model stream + cache)
  const clearShoppingInsightsCache = () => localStorage.removeItem(SHOPPING_AI_INSIGHTS_KEY);

  const generateShoppingInsights = async () => {
    if (shoppingInsightsLoading) return;

    setShoppingInsightsLoading(true);
    setCurrentTryingShoppingModel("gemini-2.0-flash");
    setShoppingModelUsed(null);
    setAiShoppingInsights("");

    const inventorySample = inventoryItems.slice(0, 5).map((i) => i.name).filter(Boolean);
    const shoppingSample = shoppingItems.slice(0, 5).map((i) => i.name).filter(Boolean);
    const okCount = Math.max(0, inventoryItems.length - outCount - lowCount);
    const highPriorityCount = shoppingItems.filter((i) => (i.priority || "").toLowerCase() === "high").length;
    const shoppingContext = {
      inventory_summary: {
        total_items: inventoryItems.length,
        out_items: outCount,
        low_items: lowCount,
        ok_items: okCount,
        sample_items: inventorySample,
      },
      shopping_summary: {
        total_items: shoppingItems.length,
        estimated_total_egp: shoppingTotal,
        high_priority_items: highPriorityCount,
        sample_items: shoppingSample,
      },
    };

    const cacheFingerprint = JSON.stringify({
      version: 2,
      context: shoppingContext,
    });

    // Check cache
    try {
      const cachedRaw = localStorage.getItem(SHOPPING_AI_INSIGHTS_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached?.fingerprint === cacheFingerprint && cached?.insights) {
          setAiShoppingInsights(cached.insights);
          setShoppingModelUsed(cached.model || "gemini-2.0-flash");
          setShoppingInsightsLoading(false);
          return;
        }
      }
    } catch {}

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const prompt =
      "You are a smart shopping & pantry advisor. Analyze this user's current inventory and shopping list. Give concise, actionable insights in 3-5 short paragraphs. Focus on: stock health (out/low items), restock urgency, wishlist cost management, and any smart tips. Use bold for key points. Be encouraging but honest.\n\n" +
      `Data:\n${JSON.stringify(shoppingContext, null, 2)}`;

    const maxTimeout = setTimeout(() => {
      setAiShoppingInsights(
        "<strong>Stock Health:</strong> Monitor out/low items and keep essentials restocked.\n\n<strong>Action:</strong> Prioritize high-priority items first.\n\n<strong>Cost Outlook:</strong> Batch non-urgent buys to optimize spend."
      );
      setShoppingModelUsed("fallback-model");
      setShoppingInsightsLoading(false);
    }, 15000);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      if (!token) {
        clearTimeout(maxTimeout);
        setAiShoppingInsights(
          "<strong>Sign In Required:</strong> Please sign in to run AI analysis.\n\n<strong>Action:</strong> Sign in and refresh insights.\n\n<strong>Tip:</strong> Your inventory data remains available locally."
        );
        setShoppingModelUsed("fallback-model");
        setShoppingInsightsLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/chat_progress?year=${year}&month=${month}&question=${encodeURIComponent(prompt)}&token=${token}`;
      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          eventSource.close();
          fallbackToRegularChat();
        }
      }, 5000);

      const fallbackToRegularChat = async () => {
        try {
          const result = await askAIQuestion(year, month, prompt);
          const answer = (result?.answer || "")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\r\n/g, "\n");
          setAiShoppingInsights(
            answer || "<strong>Stock Health:</strong> AI returned no content.\n\n<strong>Action:</strong> Please refresh insights.\n\n<strong>Cost Outlook:</strong> Keep tracking totals."
          );
          setShoppingModelUsed(result?.model_used || "fallback-model");
          localStorage.setItem(
            SHOPPING_AI_INSIGHTS_KEY,
            JSON.stringify({
              fingerprint: cacheFingerprint,
              insights: answer,
              model: result?.model_used || "fallback-model",
              updatedAt: new Date().toISOString(),
            })
          );
        } catch {
          setAiShoppingInsights(
            "<strong>AI Busy:</strong> Models are temporarily unavailable.\n\n<strong>Action:</strong> Try again in a moment.\n\n<strong>Cost Outlook:</strong> Keep using your shopping total and priorities."
          );
          setShoppingModelUsed("fallback-model");
        } finally {
          clearTimeout(maxTimeout);
          setShoppingInsightsLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "trying_model":
              setCurrentTryingShoppingModel(data.model);
              break;
            case "success": {
              clearTimeout(maxTimeout);
              const answer = (data.answer || data.summary || "")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\r\n/g, "\n");
              setAiShoppingInsights(
                answer || "<strong>Stock Health:</strong> AI returned no content.\n\n<strong>Action:</strong> Please refresh insights.\n\n<strong>Cost Outlook:</strong> Keep tracking totals."
              );
              setShoppingModelUsed(data.model);
              setShoppingInsightsLoading(false);
              eventSource.close();
              localStorage.setItem(
                SHOPPING_AI_INSIGHTS_KEY,
                JSON.stringify({
                  fingerprint: cacheFingerprint,
                  insights: answer,
                  model: data.model,
                  updatedAt: new Date().toISOString(),
                })
              );
              break;
            }
            case "model_failed":
              setCurrentTryingShoppingModel(`Failed: ${data.model}. Trying next...`);
              break;
            case "error":
              clearTimeout(maxTimeout);
              setAiShoppingInsights(
                `<strong>AI Busy:</strong> ${data.message || "All AI models are currently busy."}\n\n<strong>Action:</strong> Try again shortly.\n\n<strong>Cost Outlook:</strong> Your shopping data is still available.`
              );
              setShoppingModelUsed("fallback-model");
              setShoppingInsightsLoading(false);
              eventSource.close();
              break;
            default:
              break;
          }
        } catch {}
      };

      eventSource.onerror = () => {
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          fallbackToRegularChat();
        } else {
          clearTimeout(maxTimeout);
          setShoppingInsightsLoading(false);
        }
        eventSource.close();
      };
    } catch {
      clearTimeout(maxTimeout);
      setAiShoppingInsights(
        "<strong>Stock Health:</strong> Unable to generate AI insights now.\n\n<strong>Action:</strong> Please refresh and try again.\n\n<strong>Cost Outlook:</strong> Keep using your shopping total and priorities."
      );
      setShoppingModelUsed("fallback-model");
      setShoppingInsightsLoading(false);
    }
  };

  useEffect(() => {
    generateShoppingInsights();
  }, [inventoryItems, shoppingItems]); // Re-run when data changes

  const openQuickAdd = (mode = activeTab) => {
    setModalInitial({ ...EMPTY_FORM, mode: mode === "inventory" ? "inventory" : "shopping", category: mode === "inventory" ? "Food" : "Wishlist" });
    setModalOpen(true);
  };

  const openEdit = (item, mode) => {
    setModalInitial({ ...EMPTY_FORM, ...item, mode });
    setModalOpen(true);
  };

  const upsertItem = (form) => {
    const payload = {
      id: form.id || uid(),
      name: (form.name || "").trim(),
      category: form.category || "Other",
      quantity: toNumber(form.quantity, 0),
      unit: form.unit || "pieces",
      lowThreshold: toNumber(form.lowThreshold, 0),
      priceEstimate: toNumber(form.priceEstimate, 0),
      priority: form.priority || "Medium",
      link: (form.link || "").trim(),
      updatedAt: new Date().toISOString(),
    };
    if (!payload.name) return;

    if (form.mode === "inventory") {
      setInventoryItems((prev) =>
        prev.some((i) => i.id === payload.id)
          ? prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i))
          : [payload, ...prev]
      );
    } else {
      setShoppingItems((prev) =>
        prev.some((i) => i.id === payload.id)
          ? prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i))
          : [payload, ...prev]
      );
    }
    setModalOpen(false);
  };

  const adjustInventory = (id, delta) => {
    setInventoryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, toNumber(i.quantity, 0) + delta) } : i))
    );
  };

  const deleteInventory = (id) => setInventoryItems((prev) => prev.filter((i) => i.id !== id));
  const deleteShopping = (id) => setShoppingItems((prev) => prev.filter((i) => i.id !== id));

  // **Feature 2: Auto-populate from low-stock items**
  const populateLowItems = () => {
    const lowItems = inventoryItems.filter((i) => getStatus(i) === "low" || getStatus(i) === "out");
    let addedCount = 0;

    lowItems.forEach((item) => {
      const existing = shoppingItems.find(
        (s) => s.name.toLowerCase() === item.name.toLowerCase() && s.unit === item.unit
      );
      if (!existing) {
        setShoppingItems((prev) => [
          {
            id: uid(),
            name: item.name,
            category: item.category,
            quantity: getDefaultRestockQty(item.unit),
            unit: item.unit,
            lowThreshold: item.lowThreshold || 0,
            priceEstimate: getAveragePriceHistory(item) || 0,
            link: "",
            priority: getStatus(item) === "out" ? "High" : "Medium",
            priceHistory: item.priceHistory || [],
          },
          ...prev,
        ]);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setTimeout(() => confetti({ particleCount: 50, spread: 60 }), 200);
    }
  };

  // **Feature 4: Track price history and detect price changes**
  const updateItemPrice = (itemId, newPrice, mode = "shopping") => {
    const items = mode === "shopping" ? shoppingItems : inventoryItems;
    const setItems = mode === "shopping" ? setShoppingItems : setInventoryItems;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const history = item.priceHistory || [];
          return {
            ...item,
            priceEstimate: newPrice,
            priceHistory: [...history, { price: newPrice, date: new Date().toISOString() }].slice(-12),
          };
        }
        return item;
      })
    );
  };

  // **Feature 7: Handle receipt upload**
  const handleReceiptUpload = (extractedData) => {
    const { merchant, amount, category, date } = extractedData;
    const newItem = {
      id: uid(),
      name: merchant || "Receipt Item",
      category: category || "Food",
      quantity: 1,
      unit: "pieces",
      lowThreshold: 0,
      priceEstimate: amount || 0,
      priority: "Medium",
      link: "",
      priceHistory: [{ price: amount || 0, date }],
      updatedAt: new Date().toISOString(),
    };
    setShoppingItems((prev) => [newItem, ...prev]);
    setReceiptUploadOpen(false);
  };

  const addRestockToShopping = (item) => {
    const restockQty = getDefaultRestockQty(item.unit);
    const existing = shoppingItems.find((s) => s.name.toLowerCase() === item.name.toLowerCase() && s.unit === item.unit);
    if (existing) {
      setShoppingItems((prev) =>
        prev.map((s) => (s.id === existing.id ? { ...s, quantity: toNumber(s.quantity, 0) + restockQty, priority: "High" } : s))
      );
      return;
    }
    setShoppingItems((prev) => [
      {
        id: uid(),
        name: item.name,
        category: item.category,
        quantity: restockQty,
        unit: item.unit,
        lowThreshold: item.lowThreshold || 0,
        priceEstimate: 0,
        link: "",
        priority: getStatus(item) === "out" ? "High" : "Medium",
      },
      ...prev,
    ]);
  };

  const applyBoughtState = (item) => {
    setShoppingItems((prev) => prev.filter((s) => s.id !== item.id));
    setInventoryItems((prev) => {
      const match = prev.find((inv) => inv.name.toLowerCase() === item.name.toLowerCase() && inv.unit === item.unit);
      if (!match) {
        return [
          {
            id: uid(),
            name: item.name,
            category: item.category || "Other",
            quantity: toNumber(item.quantity, 1),
            unit: item.unit || "pieces",
            lowThreshold: toNumber(item.lowThreshold, 0),
          },
          ...prev,
        ];
      }
      return prev.map((inv) =>
        inv.id === match.id ? { ...inv, quantity: toNumber(inv.quantity, 0) + toNumber(item.quantity, 0) } : inv
      );
    });
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 }, colors: ["#10b981", "#3b82f6", "#f59e0b"] });
  };

  const guessExpenseCategoryId = (itemCategory) => {
    if (!expenseCategories.length) return "";
    const normalized = (itemCategory || "").trim().toLowerCase();
    const exact = expenseCategories.find((c) => (c?.name || "").trim().toLowerCase() === normalized);
    if (exact) return String(exact.id);
    const partial = expenseCategories.find((c) => (c?.name || "").toLowerCase().includes(normalized) || normalized.includes((c?.name || "").toLowerCase()));
    if (partial) return String(partial.id);
    return String(expenseCategories[0].id);
  };

  const openBoughtConfirm = (item) => {
    const estimatedTotal = Math.max(0, toNumber(item.priceEstimate, 0) * toNumber(item.quantity, 0));
    setBuyConfirmItem(item);
    setBuyConfirmForm({
      createTransaction: true,
      categoryId: guessExpenseCategoryId(item.category),
      amount: estimatedTotal > 0 ? String(estimatedTotal) : "",
      date: new Date().toISOString().split("T")[0],
      description: `Bought ${toNumber(item.quantity, 0)} ${item.unit} of ${item.name}`.trim(),
    });
    setBuyConfirmOpen(true);
  };

  const confirmBought = async () => {
    if (!buyConfirmItem || buyConfirmSubmitting) return;
    setBuyConfirmSubmitting(true);
    try {
      if (buyConfirmForm.createTransaction) {
        const parsedCategoryId = Number(buyConfirmForm.categoryId);
        const parsedAmount = Number(buyConfirmForm.amount);
        if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
          alert("Please select a transaction category.");
          return;
        }
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          alert("Please enter a valid amount.");
          return;
        }
        await createTransaction(
          parsedCategoryId,
          -Math.abs(parsedAmount),
          (buyConfirmForm.description || `Bought ${buyConfirmItem.name}`).trim(),
          buyConfirmForm.date || new Date().toISOString().split("T")[0]
        );
        window.dispatchEvent(new CustomEvent("transaction-added"));
      }

      applyBoughtState(buyConfirmItem);
      setBuyConfirmOpen(false);
      setBuyConfirmItem(null);
    } catch (e) {
      alert(e?.message || "Failed to save transaction.");
    } finally {
      setBuyConfirmSubmitting(false);
    }
  };

  const statusBadge = (item) => {
    const status = getStatus(item);
    if (status === "out") return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500">Out</span>;
    if (status === "low") return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-500">Low</span>;
    return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500">OK</span>;
  };

  const priorityBadge = (priority) =>
    priority === "High"
      ? "bg-rose-500/10 text-rose-500"
      : priority === "Medium"
      ? "bg-orange-500/10 text-orange-500"
      : "bg-fuchsia-500/10 text-fuchsia-500";

  return (
    <div className={`${isDark ? "bg-[#0a0e27] text-slate-200" : "bg-slate-50 text-slate-900"} min-h-screen pb-24`}>
      <section className="pt-24 pb-10 px-4 md:px-10">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className={`relative overflow-hidden rounded-[2rem] border mb-8 ${isDark ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/25 via-[#0d1d2b] to-[#0a0e27]" : "border-emerald-200 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700"}`}>
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-[90px]" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cyan-300/20 blur-[100px]" />
            <div className="relative z-10 p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                <div>
                  <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8" /> Shopping & Inventory
                  </h1>
                  <p className="text-emerald-50 mt-2 font-medium">Track what you have, what is low, and what you need to buy next.</p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 max-w-5xl">
                    <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 backdrop-blur-md shadow-lg shadow-black/10">
                      <p className="text-[10px] uppercase font-black tracking-[0.18em] text-emerald-100/80">Total Items</p>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-white text-2xl font-black leading-none">{inventoryItems.length}</p>
                        <Package className="w-4 h-4 text-emerald-100/80" />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-rose-500/20 border border-rose-300/35 px-4 py-3 backdrop-blur-md shadow-lg shadow-rose-900/20">
                      <p className="text-[10px] uppercase font-black tracking-[0.18em] text-rose-100/90">Out Of Stock</p>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-white text-2xl font-black leading-none">{outCount}</p>
                        <Flame className="w-4 h-4 text-rose-100/90" />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-orange-500/20 border border-orange-300/35 px-4 py-3 backdrop-blur-md shadow-lg shadow-orange-900/20">
                      <p className="text-[10px] uppercase font-black tracking-[0.18em] text-orange-100/90">Running Low</p>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-white text-2xl font-black leading-none">{lowCount}</p>
                        <AlertCircle className="w-4 h-4 text-orange-100/90" />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-cyan-500/20 border border-cyan-300/35 px-4 py-3 backdrop-blur-md shadow-lg shadow-cyan-900/20">
                      <p className="text-[10px] uppercase font-black tracking-[0.18em] text-cyan-100/90">Est. To Buy</p>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-white text-xl md:text-2xl font-black leading-none">{formatEGP(shoppingTotal)}</p>
                        <ShoppingCart className="w-4 h-4 text-cyan-100/90" />
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => openQuickAdd(activeTab)} 
                  className="!bg-white !text-emerald-700 hover:!bg-emerald-50 !px-7 shadow-lg"
                  icon={Plus}
                >
                  Quick Add
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs + AI toggle */}
          <div className={`p-2 rounded-2xl border mb-6 inline-flex gap-2 ${isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
            <Button
              onClick={() => setActiveTab("inventory")}
              variant={activeTab === "inventory" ? "primary" : "ghost"}
              size="sm"
              className={`!rounded-xl ${activeTab === "inventory" ? "!bg-emerald-600 shadow-lg shadow-emerald-600/20" : ""}`}
              icon={Package}
            >
              My Inventory
            </Button>
            <Button
              onClick={() => setActiveTab("shopping")}
              variant={activeTab === "shopping" ? "primary" : "ghost"}
              size="sm"
              className={`!rounded-xl ${activeTab === "shopping" ? "!bg-emerald-600 shadow-lg shadow-emerald-600/20" : ""}`}
              icon={ShoppingCart}
            >
              Shopping List
            </Button>
            <Button
              onClick={() => setShowInsightsCard((s) => !s)}
              variant={showInsightsCard ? "primary" : "ghost"}
              size="sm"
              className={`!rounded-xl ${showInsightsCard ? "!bg-amber-600 shadow-lg shadow-amber-600/20" : ""}`}
              icon={Bot}
            >
              AI Insights
            </Button>
          </div>

          {/* Action Buttons for Features */}
          <div className="flex flex-wrap gap-3 mb-6">
            {activeTab === "shopping" && (
              <>
                <Button
                  onClick={() => setReceiptUploadOpen(true)}
                  variant="secondary"
                  size="sm"
                  className="!rounded-xl !text-xs !font-black !uppercase"
                  icon={Upload}
                >
                  Upload Receipt
                </Button>
              </>
            )}
            {activeTab === "inventory" && lowCount > 0 && (
              <Button
                onClick={populateLowItems}
                variant="secondary"
                size="sm"
                className="!rounded-xl !text-xs !font-black !uppercase"
                icon={TrendingDown}
              >
                Populate Low Items
              </Button>
            )}
            {activeTab === "shopping" && categoryBreakdown.length > 0 && (
              <Button
                onClick={() => setShowCategoryBreakdown((s) => !s)}
                variant="secondary"
                size="sm"
                className="!rounded-xl !text-xs !font-black !uppercase"
                icon={BarChart3}
              >
                View Breakdown
              </Button>
            )}
          </div>

          {/* Category Breakdown (Feature 9) */}
          {activeTab === "shopping" && showCategoryBreakdown && categoryBreakdown.length > 0 && (
            <Card className="mb-8 p-6 !rounded-2xl">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Spending by Category
              </h3>
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">{cat.name}</span>
                      <span className={`text-sm font-black ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        {formatEGP(cat.total)} ({cat.count} items)
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                        style={{ width: `${Math.min(cat.percent, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-slate-500">{cat.percent.toFixed(1)}% of total</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {["All", ...CATEGORIES].map((cat) => (
              <Button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                variant={activeCategory === cat ? "primary" : "ghost"}
                size="xs"
                className={`!rounded-xl ${activeCategory === cat ? "!bg-emerald-600 shadow-lg" : isDark ? "!bg-slate-800 !text-slate-300 hover:!bg-slate-700" : "!bg-slate-100 !text-slate-700 hover:!bg-slate-200"}`}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Inventory Summary Card (only on Inventory tab) */}
          {activeTab === "inventory" && (outCount > 0 || lowCount > 0) && (
            <Card className="mb-8 text-center p-6 !rounded-3xl">
              <p className="text-lg font-black tracking-wide">
                Inventory Status:{" "}
                <span className="text-rose-500 font-black"> {outCount} out of stock</span>{" "}
                <span className="text-slate-500">•</span>{" "}
                <span className="text-orange-500 font-black"> {lowCount} running low</span>
              </p>
            </Card>
          )}

          {/* AI Insights Card */}
          <div className={`transition-all duration-500 ease-out overflow-hidden ${showInsightsCard ? "max-h-[1400px] opacity-100 translate-y-0 mb-16" : "max-h-0 opacity-0 -translate-y-3 mb-0"}`}>
            <Card className="p-10 !rounded-[2.5rem] relative overflow-hidden" animate={true}>
              {shoppingModelUsed && (
                <div className="absolute top-8 right-8 z-10">
                  {(() => {
                    const modelInfo = getModelInfo(shoppingModelUsed);
                    const colorMap = {
                      emerald: "from-emerald-500/20 to-green-500/20 border-emerald-400/50 text-emerald-300",
                      blue: "from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-300",
                      cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-300",
                      purple: "from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300",
                      green: "from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300",
                      orange: "from-orange-500/20 to-yellow-500/20 border-orange-400/50 text-orange-300",
                      pink: "from-pink-500/20 to-rose-500/20 border-pink-400/50 text-pink-300",
                      gray: "from-gray-500/20 to-slate-500/20 border-gray-400/50 text-gray-300",
                      yellow: "from-yellow-500/20 to-amber-500/20 border-yellow-400/50 text-yellow-300",
                      amber: "from-amber-500/20 to-yellow-500/20 border-amber-400/50 text-amber-300",
                    };
                    const colorClass = colorMap[modelInfo.color] || colorMap.amber;

                    return (
                      <div className={`bg-gradient-to-br ${colorClass} backdrop-blur-xl rounded-2xl px-5 py-2.5 border-2 shadow-xl flex items-center gap-3 transform hover:scale-105 transition-transform duration-300`}>
                        {modelInfo.logo.startsWith("http") ? (
                          <img src={modelInfo.logo} alt={modelInfo.name} className="w-5 h-5 object-contain rounded-lg" />
                        ) : (
                          <span className="text-lg">{modelInfo.logo}</span>
                        )}
                        <span className="font-black tracking-[0.2em] text-sm uppercase">{modelInfo.name}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-amber-500/10 rounded-2xl border-2 border-amber-500/20 shadow-inner">
                  {shoppingInsightsLoading && currentTryingShoppingModel ? (
                    (() => {
                      const modelInfo = getModelInfo(currentTryingShoppingModel);
                      return modelInfo.logo.startsWith("http") ? (
                        <img src={modelInfo.logo} alt={modelInfo.name} className="w-8 h-8 object-contain animate-pulse rounded-lg" />
                      ) : (
                        <span className="text-3xl animate-pulse">{modelInfo.logo}</span>
                      );
                    })()
                  ) : shoppingInsightsLoading ? (
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  ) : (
                    (() => {
                      const insightText = aiShoppingInsights?.toLowerCase() || "";
                      const isPositive =
                        insightText.includes("healthy") ||
                        insightText.includes("well stocked") ||
                        insightText.includes("great job") ||
                        insightText.includes("under control") ||
                        insightText.includes("discipline");
                      const isBad =
                        insightText.includes("many out") ||
                        insightText.includes("critical") ||
                        insightText.includes("overdue") ||
                        insightText.includes("emergency");
                      const isModerate =
                        insightText.includes("monitor") ||
                        insightText.includes("low on") ||
                        insightText.includes("attention needed");

                      if (isPositive) return <TrendingUp className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />;
                      if (isBad) return <Target className="w-8 h-8 text-rose-500" strokeWidth={2.5} />;
                      if (isModerate) return <AlertCircle className="w-8 h-8 text-amber-500" strokeWidth={2.5} />;
                      return <Bot className="w-8 h-8 text-amber-500" strokeWidth={2.5} />;
                    })()
                  )}
                </div>
                <h3 className={`text-3xl font-black tracking-[0.2em] uppercase ${theme === "dark" ? "text-white" : "text-slate-900"}`}>AI Shopping Insights</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                <div className="md:col-span-8 space-y-6 pr-10 border-r-2 border-slate-700/10">
                  {shoppingInsightsLoading ? (
                    <div className="space-y-4">
                      <div className={`h-6 ${theme === "dark" ? "bg-slate-700/50" : "bg-slate-200/50"} rounded-[1rem] animate-pulse w-full`}></div>
                      <div className={`h-6 ${theme === "dark" ? "bg-slate-700/50" : "bg-slate-200/50"} rounded-[1rem] animate-pulse w-5/6`}></div>
                      <div className={`h-6 ${theme === "dark" ? "bg-slate-700/50" : "bg-slate-200/50"} rounded-[1rem] animate-pulse w-4/6`}></div>
                    </div>
                  ) : aiShoppingInsights ? (
                    aiShoppingInsights.split("\n\n").map((line, index) => (
                      <div 
                        key={index} 
                        className={`text-lg font-bold leading-relaxed ${theme === "dark" ? "text-slate-300" : "text-slate-700"} animate-in fade-in slide-in-from-left-5 duration-500`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        dangerouslySetInnerHTML={{ __html: line }}
                      />
                    ))
                  ) : (
                    <p className={`text-xl font-bold ${theme === "dark" ? "text-slate-400" : "text-slate-600"} italic`}>Waiting for inventory data to analyze...</p>
                  )}
                </div>

                <div className="md:col-span-4 flex flex-col justify-center h-full gap-6">
                  <div className={`p-6 rounded-[2rem] ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-100/50"} border-2 border-amber-500/10 shadow-inner`}>
                    <p className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Analysis Status</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${shoppingInsightsLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"} shadow-lg shadow-current/20`}></div>
                      <span className="font-black text-lg tracking-[0.2em] uppercase">{shoppingInsightsLoading ? "Analyzing..." : "Ready"}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 leading-tight">Your shopping & pantry is being analyzed in real-time by AI models.</p>
                  </div>

                  <Button
                    onClick={() => {
                      clearShoppingInsightsCache();
                      generateShoppingInsights();
                    }}
                    loading={shoppingInsightsLoading}
                    variant="primary"
                    className="w-full !rounded-[1.5rem] !py-5 shadow-2xl transition-all duration-500"
                    icon={RefreshCw}
                  >
                    REFRESH INSIGHTS
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          {activeTab === "inventory" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredInventoryItems.length === 0 ? (
                <Card className="col-span-full p-10 !rounded-3xl border-2 border-dashed text-center" animate={false}>
                  <Package className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                  <p className={`font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>No inventory items for this filter.</p>
                  <Button 
                    onClick={() => openQuickAdd("inventory")} 
                    className="mt-4 !rounded-xl"
                    size="sm"
                  >
                    Add First Item
                  </Button>
                </Card>
              ) : (
                filteredInventoryItems.map((item) => {
                  const status = getStatus(item);
                  return (
                    <Card
                      key={item.id}
                      className="p-5 !rounded-3xl shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>{item.name}</p>
                          <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.category}</p>
                        </div>
                        {statusBadge(item)}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm`}>Current stock</span>
                          <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{toNumber(item.quantity, 0)} {item.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm`}>Low threshold</span>
                          <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{toNumber(item.lowThreshold, 0)} {item.unit}</span>
                        </div>
                      </div>

                      {status === "out" && (
                        <Button
                          onClick={() => addRestockToShopping(item)}
                          variant="danger"
                          className="w-full mb-3 !rounded-xl"
                          size="sm"
                          icon={Flame}
                        >
                          Out! Add To Shopping
                        </Button>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Button
                          onClick={() => adjustInventory(item.id, 1)}
                          variant="ghost"
                          size="xs"
                          className={`!rounded-xl ${isDark ? "!bg-emerald-500/10 !text-emerald-400" : "!bg-emerald-50 !text-emerald-600"}`}
                          icon={Plus}
                        >
                          1
                        </Button>
                        <Button
                          onClick={() => adjustInventory(item.id, -1)}
                          variant="ghost"
                          size="xs"
                          className={`!rounded-xl ${isDark ? "!bg-rose-500/10 !text-rose-400" : "!bg-rose-50 !text-rose-600"}`}
                          icon={Minus}
                        >
                          1
                        </Button>
                        <Button
                          onClick={() => adjustInventory(item.id, 5)}
                          variant="ghost"
                          size="xs"
                          className={`!rounded-xl ${isDark ? "!bg-emerald-500/10 !text-emerald-400" : "!bg-emerald-50 !text-emerald-600"}`}
                          icon={Plus}
                        >
                          5
                        </Button>
                        <Button
                          onClick={() => adjustInventory(item.id, 10)}
                          variant="ghost"
                          size="xs"
                          className={`!rounded-xl ${isDark ? "!bg-emerald-500/10 !text-emerald-400" : "!bg-emerald-50 !text-emerald-600"}`}
                          icon={Plus}
                        >
                          10
                        </Button>
                        <Button
                          onClick={() => addRestockToShopping(item)}
                          variant="ghost"
                          size="xs"
                          className={`!rounded-xl ${isDark ? "!bg-orange-500/10 !text-orange-400" : "!bg-orange-50 !text-orange-600"}`}
                        >
                          Restock
                        </Button>
                        <Button
                          onClick={() => openEdit(item, "inventory")}
                          variant="ghost"
                          size="xs"
                          className={`!rounded-xl ${isDark ? "!bg-emerald-500/10 !text-emerald-400" : "!bg-emerald-50 !text-emerald-600"}`}
                          icon={Edit}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => deleteInventory(item.id)}
                          variant="ghost"
                          size="xs"
                          className="col-span-2 md:col-span-1 !rounded-xl !bg-rose-500/10 !text-rose-500 hover:!bg-rose-500/20"
                          icon={Trash2}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <div>
              <Card className="mb-6 p-5 md:p-6 !rounded-3xl shadow-xl">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Estimated Total</p>
                <h2 className={`text-3xl md:text-4xl font-black text-emerald-500 ${pulseTotal ? "animate-pulse" : ""}`}>
                  {formatEGP(shoppingTotal)}
                </h2>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredShoppingItems.length === 0 ? (
                  <Card className="col-span-full p-10 !rounded-3xl border-2 border-dashed text-center" animate={false}>
                    <ShoppingCart className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                    <p className={`font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Shopping list is empty for this filter.</p>
                    <Button 
                      onClick={() => openQuickAdd("shopping")} 
                      className="mt-4 !rounded-xl"
                      size="sm"
                    >
                      Add To-Buy Item
                    </Button>
                  </Card>
                ) : (
                  filteredShoppingItems.map((item) => (
                    <Card key={item.id} className="p-5 !rounded-3xl shadow-lg">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>{item.name}</p>
                          <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.category}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${priorityBadge(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm`}>Need to buy</span>
                          <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{toNumber(item.quantity, 0)} {item.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm`}>Est. Price</span>
                          <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                            {toNumber(item.priceEstimate, 0) > 0 ? formatEGP(toNumber(item.priceEstimate, 0) * toNumber(item.quantity, 0)) : "Not set"}
                          </span>
                        </div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-fuchsia-500 hover:text-fuchsia-400"
                          >
                            Open Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => openBoughtConfirm(item)}
                          variant="primary"
                          className="col-span-2 !rounded-xl !bg-emerald-500 hover:!bg-emerald-600"
                          size="sm"
                          icon={Check}
                        >
                          Mark As Bought
                        </Button>
                        <Button
                          onClick={() => openEdit(item, "shopping")}
                          variant="ghost"
                          size="xs"
                          className={`!rounded-xl ${isDark ? "!bg-emerald-500/10 !text-emerald-400" : "!bg-emerald-50 !text-emerald-600"}`}
                          icon={Edit}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => deleteShopping(item.id)}
                          variant="ghost"
                          size="xs"
                          className="!rounded-xl !bg-rose-500/10 !text-rose-500 hover:!bg-rose-500/20"
                          icon={Trash2}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Floating Quick Add Button */}
      <Button
        onClick={() => openQuickAdd(activeTab)}
        className="fixed bottom-8 right-6 z-40 !w-14 !h-14 !rounded-2xl !bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 flex items-center justify-center hover:!bg-emerald-700 active:scale-95 transition-all"
        title="Quick Add Item"
        icon={Plus}
      />

      {/* Low/Out Floating Badge */}
      {inventoryItems.some((i) => getStatus(i) !== "ok") && (
        <div className="fixed bottom-8 left-6 z-30">
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-black uppercase tracking-wider ${isDark ? "bg-slate-900/90 border-slate-700 text-orange-400" : "bg-white border-slate-200 text-orange-600"}`}>
            <AlertCircle className="w-4 h-4" />
            {outCount} out / {lowCount} low
          </div>
        </div>
      )}

      {/* Modals */}
      <ItemModal open={modalOpen} initial={modalInitial} isDark={isDark} onClose={() => setModalOpen(false)} onSubmit={upsertItem} />
      <ReceiptUploadModal open={receiptUploadOpen} isDark={isDark} onClose={() => setReceiptUploadOpen(false)} onUploadSuccess={handleReceiptUpload} />

      {buyConfirmOpen && buyConfirmItem && (
        <div className="fixed inset-0 z-[10000]">
          <div
            className={`absolute inset-0 ${isDark ? "bg-slate-950/85" : "bg-slate-900/65"} backdrop-blur-sm`}
            onClick={() => !buyConfirmSubmitting && setBuyConfirmOpen(false)}
          />
          <div className="relative h-full flex items-center justify-center p-3 md:p-6">
            <div className={`w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
              <div className={`px-5 md:px-7 py-4 border-b flex items-center justify-between ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Purchase Confirmation</p>
                  <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>Mark As Bought</h3>
                </div>
                <button
                  onClick={() => setBuyConfirmOpen(false)}
                  disabled={buyConfirmSubmitting}
                  className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-400 disabled:opacity-50" : "hover:bg-slate-100 text-slate-500 disabled:opacity-50"}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 md:p-7 space-y-4">
                <div className={`rounded-2xl border p-4 ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>{buyConfirmItem.name}</p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {toNumber(buyConfirmItem.quantity, 0)} {buyConfirmItem.unit} • {buyConfirmItem.category}
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buyConfirmForm.createTransaction}
                    onChange={(e) => setBuyConfirmForm((prev) => ({ ...prev, createTransaction: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Also create expense transaction
                  </span>
                </label>

                {buyConfirmForm.createTransaction && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Category</label>
                      <select
                        value={buyConfirmForm.categoryId}
                        onChange={(e) => setBuyConfirmForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                      >
                        <option value="">Select expense category</option>
                        {expenseCategories.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Amount (EGP)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={buyConfirmForm.amount}
                        onChange={(e) => setBuyConfirmForm((prev) => ({ ...prev, amount: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Date</label>
                      <input
                        type="date"
                        value={buyConfirmForm.date}
                        onChange={(e) => setBuyConfirmForm((prev) => ({ ...prev, date: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-[11px] font-black uppercase tracking-[0.16em] mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Description</label>
                      <input
                        value={buyConfirmForm.description}
                        onChange={(e) => setBuyConfirmForm((prev) => ({ ...prev, description: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-2xl border-2 outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={() => setBuyConfirmOpen(false)}
                    disabled={buyConfirmSubmitting}
                    variant="ghost"
                    className="!flex-1 !py-3 !rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmBought}
                    loading={buyConfirmSubmitting}
                    variant="primary"
                    className="!flex-1 !py-3 !rounded-2xl !bg-emerald-600 hover:!bg-emerald-700"
                  >
                    Confirm Purchase
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


