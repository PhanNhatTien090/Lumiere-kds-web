import React, { useEffect, useState } from "react";
import { AlertTriangle, ChefHat, Loader2, Search, X } from "lucide-react";
import {
  inventoryAPI,
  kitchenMenuAPI,
  menuAPI,
  KitchenInventoryItem,
  KitchenMenuItem,
} from "@/api/endpoints";

interface OutOfStockModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "ingredient" | "menu";

export const OutOfStockModal: React.FC<OutOfStockModalProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState<Tab>("ingredient");
  const [ingredients, setIngredients] = useState<KitchenInventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<KitchenMenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ingRes, menuList] = await Promise.all([
        inventoryAPI.list(),
        menuAPI.listFlat(),
      ]);
      setIngredients(ingRes.data.data ?? []);
      setMenuItems(menuList);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSearch("");
      void refresh();
    }
  }, [open]);

  if (!open) return null;

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMenu = menuItems.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(640px,92vw)] max-h-[85vh] flex flex-col bg-kds-card border border-kds-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-kds-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-kds-gold" size={20} />
            <h2 className="text-lg font-semibold text-gray-100">Báo hết</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-kds-border px-2 pt-2 gap-1 shrink-0">
          <TabButton active={tab === "ingredient"} onClick={() => setTab("ingredient")}>
            🥕 Nguyên liệu
          </TabButton>
          <TabButton active={tab === "menu"} onClick={() => setTab("menu")}>
            <ChefHat size={14} className="inline mr-1" /> Món ăn
          </TabButton>
        </div>

        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "ingredient" ? "Tìm nguyên liệu…" : "Tìm món…"}
              className="w-full bg-kds-bg border border-kds-border rounded-md pl-9 pr-3 py-2 text-sm text-gray-100 outline-none focus:border-kds-gold/60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {error && (
            <div className="bg-kds-redText/15 border border-kds-redText/40 text-kds-redText text-sm rounded-md px-3 py-2 mb-3">
              {error}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4 justify-center">
              <Loader2 size={14} className="animate-spin" /> Đang tải…
            </div>
          )}

          {!loading && tab === "ingredient" && (
            <IngredientList items={filteredIngredients} onReported={refresh} />
          )}
          {!loading && tab === "menu" && (
            <MenuList items={filteredMenu} onReported={refresh} />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
      active
        ? "bg-kds-bg text-kds-gold border-b-2 border-kds-gold"
        : "text-gray-400 hover:text-gray-200"
    }`}
  >
    {children}
  </button>
);

const IngredientList: React.FC<{
  items: KitchenInventoryItem[];
  onReported: () => Promise<void>;
}> = ({ items, onReported }) => {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-6">
        Không có nguyên liệu nào khớp.
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((ing) => (
        <IngredientRow key={ing.id} item={ing} onReported={onReported} />
      ))}
    </ul>
  );
};

const IngredientRow: React.FC<{
  item: KitchenInventoryItem;
  onReported: () => Promise<void>;
}> = ({ item, onReported }) => {
  const [editing, setEditing] = useState(false);
  const empty = Number(item.currentQty) === 0;

  return (
    <>
      <li className="flex items-center gap-3 px-3 py-2 rounded-md bg-kds-bg/60 border border-kds-border">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-100 font-medium truncate">
            {item.name}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            Tồn:{" "}
            <span className={empty ? "text-kds-redText" : "text-gray-300"}>
              {item.currentQty} {item.unit}
            </span>
            {" · "}
            Ngưỡng: {item.lowStockThreshold}
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${
            empty
              ? "bg-amber-700/30 text-amber-300 border border-amber-700/60 hover:bg-amber-700/40"
              : "bg-kds-redText/20 text-kds-redText border border-kds-redText/40 hover:bg-kds-redText/30"
          }`}
        >
          {empty ? "Nhập lại tồn" : "Cập nhật tồn"}
        </button>
      </li>
      {editing && (
        <AdjustQuantityDialog
          item={item}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await onReported();
          }}
        />
      )}
    </>
  );
};

const AdjustQuantityDialog: React.FC<{
  item: KitchenInventoryItem;
  onClose: () => void;
  onSaved: () => Promise<void>;
}> = ({ item, onClose, onSaved }) => {
  const currentQty = Number(item.currentQty);
  const [qtyText, setQtyText] = useState<string>("0");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedQty = Number(qtyText);
  const qtyValid =
    qtyText.trim() !== "" && !isNaN(parsedQty) && parsedQty >= 0;
  const noteRequired = parsedQty === 0;
  const noteValid = !noteRequired || note.trim().length > 0;
  const noChange = qtyValid && parsedQty === currentQty;

  const submit = async () => {
    if (!qtyValid) {
      setError("Số tồn phải là số ≥ 0.");
      return;
    }
    if (!noteValid) {
      setError("Vui lòng nhập lý do khi báo hết (số tồn = 0).");
      return;
    }
    if (noChange) {
      setError("Số tồn mới trùng với tồn hiện tại — không có gì để cập nhật.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await inventoryAPI.adjust(item.id, {
        newQuantity: parsedQty,
        note: note.trim() || undefined,
      });
      await onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Lỗi cập nhật tồn.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(420px,92vw)] bg-kds-card border border-kds-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-kds-border">
          <h3 className="text-sm font-semibold text-gray-100">
            Cập nhật tồn: {item.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="text-[12px] text-gray-400">
            Tồn hiện tại:{" "}
            <span className="text-gray-200 font-medium">
              {currentQty} {item.unit}
            </span>
            {" · "}Ngưỡng: {item.lowStockThreshold}
          </div>

          <div>
            <label className="block text-[12px] text-gray-300 mb-1">
              Số tồn hiện tại còn lại ({item.unit})
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={qtyText}
              onChange={(e) => setQtyText(e.target.value)}
              autoFocus
              className="w-full bg-kds-bg border border-kds-border rounded-md px-3 py-2 text-sm text-gray-100 outline-none focus:border-kds-gold/60"
            />
            <div className="flex gap-1 mt-2">
              {[0, Math.floor(currentQty / 2), Math.max(0, currentQty - 1)]
                .filter(
                  (v, i, arr) =>
                    v >= 0 && arr.findIndex((x) => x === v) === i,
                )
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setQtyText(String(v))}
                    className="px-2 py-0.5 text-[11px] rounded border border-kds-border text-gray-300 hover:bg-kds-bg/80"
                  >
                    {v === 0 ? "Hết (0)" : `${v} ${item.unit}`}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-gray-300 mb-1">
              Ghi chú{noteRequired ? " (bắt buộc khi báo hết)" : " (tuỳ chọn)"}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                noteRequired ? "VD: Đã hết, cần nhập thêm" : "Lý do điều chỉnh..."
              }
              className="w-full bg-kds-bg border border-kds-border rounded-md px-3 py-2 text-sm text-gray-100 outline-none focus:border-kds-gold/60"
            />
          </div>

          {error && (
            <div className="bg-kds-redText/15 border border-kds-redText/40 text-kds-redText text-xs rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-kds-border bg-kds-bg/40">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-kds-border text-gray-300 hover:bg-kds-bg/80"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !qtyValid || !noteValid || noChange}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-kds-gold/20 text-kds-gold border border-kds-gold/40 hover:bg-kds-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuList: React.FC<{
  items: KitchenMenuItem[];
  onReported: () => Promise<void>;
}> = ({ items, onReported }) => {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-6">
        Không có món nào khớp.
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((m) => (
        <MenuRow key={m.id} item={m} onReported={onReported} />
      ))}
    </ul>
  );
};

const MenuRow: React.FC<{
  item: KitchenMenuItem;
  onReported: () => Promise<void>;
}> = ({ item, onReported }) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const off = !item.available;

  const report = async () => {
    const reason = window.prompt(
      `Lý do tắt món "${item.name}" (bắt buộc):`,
      "",
    );
    if (reason == null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      window.alert("Vui lòng nhập lý do.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await kitchenMenuAPI.markUnavailable(item.id, trimmed);
      await onReported();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Lỗi tắt món.");
    } finally {
      setPending(false);
    }
  };

  return (
    <li className="flex items-center gap-3 px-3 py-2 rounded-md bg-kds-bg/60 border border-kds-border">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-100 font-medium truncate">{item.name}</div>
        <div className="text-[11px] mt-0.5">
          {off ? (
            <span className="text-kds-redText">Đang tắt — manager mới bật lại được</span>
          ) : (
            <span className="text-gray-500">Đang phục vụ</span>
          )}
        </div>
        {error && <div className="text-[11px] text-kds-redText mt-0.5">{error}</div>}
      </div>
      <button
        onClick={report}
        disabled={pending || off}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${
          off
            ? "bg-zinc-700 text-gray-500 cursor-not-allowed"
            : "bg-kds-redText/20 text-kds-redText border border-kds-redText/40 hover:bg-kds-redText/30"
        }`}
      >
        {pending ? "..." : off ? "Đã tắt" : "Tắt món"}
      </button>
    </li>
  );
};
