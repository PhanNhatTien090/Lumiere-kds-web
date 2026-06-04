import React, { useEffect, useState } from "react";
import { KeyRound, Loader2, X, CheckCircle2 } from "lucide-react";
import { authAPI } from "@/api/endpoints";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

/** Validate khớp policy backend: ≥8 ký tự, ≥1 chữ HOA, ≥1 số. */
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Mật khẩu mới phải ≥ 8 ký tự";
  if (!/[A-Z]/.test(pw)) return "Mật khẩu mới phải có ít nhất 1 chữ HOA";
  if (!/\d/.test(pw)) return "Mật khẩu mới phải có ít nhất 1 chữ số";
  return null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setError(null);
      setOk(false);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!currentPassword.trim()) {
      setError("Nhập mật khẩu hiện tại");
      return;
    }
    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (newPassword !== confirm) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setOk(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Lỗi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(420px,92vw)] flex flex-col bg-kds-card border border-kds-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-kds-border">
          <div className="flex items-center gap-2">
            <KeyRound className="text-kds-gold" size={20} />
            <h2 className="text-lg font-semibold text-gray-100">Đổi mật khẩu</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {ok ? (
          <div className="px-5 py-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-kds-greenText">
              <CheckCircle2 size={20} />
              <span className="font-medium">Đổi mật khẩu thành công</span>
            </div>
            <button
              onClick={onClose}
              className="h-10 px-6 rounded-lg bg-kds-gold text-black font-semibold hover:brightness-110 transition"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 flex flex-col gap-3">
            {error && (
              <div className="text-sm text-kds-redText bg-kds-redText/10 border border-kds-redText/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <Field label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword} />
            <Field
              label="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="≥8 ký tự, 1 chữ HOA, 1 số"
            />
            <Field label="Xác nhận mật khẩu mới" value={confirm} onChange={setConfirm} />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="h-10 px-4 rounded-lg bg-kds-bg border border-kds-border text-gray-300 hover:text-gray-100 transition"
              >
                Huỷ
              </button>
              <button
                onClick={() => void submit()}
                disabled={loading}
                className="h-10 px-5 rounded-lg bg-kds-gold text-black font-semibold hover:brightness-110 transition disabled:opacity-60 flex items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Đang lưu..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-gray-400">{label}</span>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 px-3 rounded-lg bg-kds-bg border border-kds-border text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-kds-gold/40"
    />
  </label>
);
