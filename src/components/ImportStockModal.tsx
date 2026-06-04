import React, { useEffect, useMemo, useState } from "react";
import { Loader2, PackagePlus, Search, X } from "lucide-react";
import { inventoryAPI, KitchenInventoryItem } from "@/api/endpoints";

interface ImportStockModalProps {
  open: boolean;
  onClose: () => void;
}

type ExpiryMode = "days" | "date";

/** Nhập kho kèm hạn dùng ngay từ KDS. Tạo lô mới (FEFO) cho nguyên liệu. */
export const ImportStockModal: React.FC<ImportStockModalProps> = ({ open, onClose }) => {
  const [ingredients, setIngredients] = useState<KitchenInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KitchenInventoryItem | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryAPI.list();
      setIngredients(res.data.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Không tải được danh sách nguyên liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(null);
      void refresh();
    }
  }, [open]);

  if (!open) return null;

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(560px,92vw)] max-h-[85vh] flex flex-col bg-kds-card border border-kds-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-kds-border">
          <div className="flex items-center gap-2">
            <PackagePlus className="text-kds-gold" size={20} />
            <h2 className="text-lg font-semibold text-gray-100">Nhập kho</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm nguyên liệu cần nhập…"
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
              {!loading && filtered.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-6">
                  Không có nguyên liệu nào khớp.
                </div>
              )}
              {!loading && (
                <ul className="space-y-1.5">
                  {filtered.map((ing) => (
                    <li
                      key={ing.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md bg-kds-bg/60 border border-kds-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-100 font-medium truncate">
                          {ing.name}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Tồn: <span className="text-gray-300">{ing.currentQty} {ing.unit}</span>
                          {" · "}Ngưỡng: {ing.lowStockThreshold}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelected(ing)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 bg-kds-gold/20 text-kds-gold border border-kds-gold/40 hover:bg-kds-gold/30"
                      >
                        Nhập kho
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <ImportForm
            item={selected}
            onBack={() => setSelected(null)}
            onDone={() => {
              setSelected(null);
              void refresh();
            }}
          />
        )}
      </div>
    </div>
  );
};

// ── Import form ───────────────────────────────────────────────────────────────

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const ImportForm: React.FC<{
  item: KitchenInventoryItem;
  onBack: () => void;
  onDone: () => void;
}> = ({ item, onBack, onDone }) => {
  const [qtyText, setQtyText] = useState("1");
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>("days");
  const [shelfLifeDays, setShelfLifeDays] = useState(7);
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minExpiry = useMemo(() => todayPlus(1), []);
  const previewExpiry = useMemo(
    () => (shelfLifeDays > 0 ? todayPlus(shelfLifeDays) : null),
    [shelfLifeDays],
  );

  const parsedQty = Number(qtyText);
  const qtyValid = qtyText.trim() !== "" && !isNaN(parsedQty) && parsedQty > 0;

  const submit = async () => {
    if (!qtyValid) {
      setError("Số lượng nhập phải lớn hơn 0.");
      return;
    }
    if (expiryMode === "days" && !(shelfLifeDays > 0)) {
      setError("Số ngày sử dụng phải lớn hơn 0.");
      return;
    }
    if (expiryMode === "date") {
      if (!expiryDate) { setError("Chọn ngày hết hạn."); return; }
      if (expiryDate < minExpiry) { setError("Hạn sử dụng phải sau ngày hôm nay."); return; }
    }
    setPending(true);
    setError(null);
    try {
      await inventoryAPI.importStock({
        ingredientId: item.id,
        quantity: parsedQty,
        ...(expiryMode === "days" ? { shelfLifeDays } : { expiryDate }),
        note: note.trim() || undefined,
      });
      onDone();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Lỗi nhập kho.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="text-[12px] text-gray-400">
          Nguyên liệu: <span className="text-gray-100 font-medium">{item.name}</span>
          {" · "}Tồn hiện tại: <span className="text-gray-200">{item.currentQty} {item.unit}</span>
        </div>

        <div>
          <label className="block text-[12px] text-gray-300 mb-1">
            Số lượng nhập ({item.unit})
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
        </div>

        <div>
          <label className="block text-[12px] text-gray-300 mb-1">Hạn sử dụng</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-1.5 text-[12px] text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="kdsExpiryMode"
                checked={expiryMode === "days"}
                onChange={() => setExpiryMode("days")}
              />
              Theo số ngày sử dụng
            </label>
            <label className="flex items-center gap-1.5 text-[12px] text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="kdsExpiryMode"
                checked={expiryMode === "date"}
                onChange={() => setExpiryMode("date")}
              />
              Chọn ngày hết hạn
            </label>
          </div>
          {expiryMode === "days" ? (
            <>
              <input
                type="number"
                min={1}
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(+e.target.value)}
                placeholder="VD: 7"
                className="w-full bg-kds-bg border border-kds-border rounded-md px-3 py-2 text-sm text-gray-100 outline-none focus:border-kds-gold/60"
              />
              {previewExpiry && (
                <div className="text-[11px] text-gray-500 mt-1">
                  Hết hạn dự kiến: <span className="text-gray-300">{previewExpiry}</span>
                  {" "}(hôm nay + {shelfLifeDays} ngày)
                </div>
              )}
            </>
          ) : (
            <input
              type="date"
              min={minExpiry}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-kds-bg border border-kds-border rounded-md px-3 py-2 text-sm text-gray-100 outline-none focus:border-kds-gold/60"
            />
          )}
        </div>

        <div>
          <label className="block text-[12px] text-gray-300 mb-1">Ghi chú (tuỳ chọn)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Hàng giao buổi sáng"
            className="w-full bg-kds-bg border border-kds-border rounded-md px-3 py-2 text-sm text-gray-100 outline-none focus:border-kds-gold/60"
          />
        </div>

        {error && (
          <div className="bg-kds-redText/15 border border-kds-redText/40 text-kds-redText text-xs rounded-md px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 px-4 py-3 border-t border-kds-border bg-kds-bg/40">
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-kds-border text-gray-300 hover:bg-kds-bg/80"
        >
          ← Chọn nguyên liệu khác
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !qtyValid}
          className="px-4 py-1.5 text-xs font-semibold rounded-md bg-kds-gold/20 text-kds-gold border border-kds-gold/40 hover:bg-kds-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Đang nhập..." : "Xác nhận nhập kho"}
        </button>
      </div>
    </>
  );
};
