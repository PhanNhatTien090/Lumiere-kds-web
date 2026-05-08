import React from 'react';
import {
  ChefHat, LayoutGrid, BrainCircuit, CheckCircle2,
  LogOut, Volume2, VolumeX, Wifi, WifiOff,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'live' | 'batching' | 'completed';
  setActiveTab: (tab: 'live' | 'batching' | 'completed') => void;
  onLogout: () => void;
  waitingCount: number;
  cookingCount: number;
  doneCount: number;
  batchingCount: number;
  isConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  now: Date;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  waitingCount,
  cookingCount,
  doneCount,
  batchingCount,
  isConnected,
  soundEnabled,
  onToggleSound,
  now,
}) => {
  const clock = now.toLocaleTimeString('vi-VN', { hour12: false });

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 bg-kds-bg border-b border-kds-border shrink-0">

      {/* ── Brand ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-[210px]">
        <div className="w-10 h-10 bg-kds-card rounded-lg flex items-center justify-center border border-kds-gold/40 shrink-0">
          <ChefHat className="text-kds-gold" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold tracking-[0.08em] text-[#f5e6a3] leading-tight">
            LUMIÈRE Kitchen
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-500 ${
                isConnected ? 'bg-kds-greenText' : 'bg-kds-redText animate-pulse'
              }`}
            />
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              {isConnected
                ? <><Wifi size={10} className="inline" /> Trực tuyến</>
                : <><WifiOff size={10} className="inline" /> Ngoại tuyến</>
              }
              <span className="text-gray-600">•</span>
              <span>Ca bếp đang chạy</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats + Clock ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <StatBox value={waitingCount} label="Chờ nấu" valueClass="text-kds-gold" />
        <StatBox value={cookingCount} label="Đang nấu" valueClass="text-kds-blueText" />
        <StatBox value={doneCount}    label="Hoàn thành" valueClass="text-kds-greenText" />

        <div className="w-px h-9 bg-kds-border mx-1 shrink-0" />

        <div className="px-4 py-2 bg-kds-card rounded-lg border border-kds-border text-center min-w-[88px]">
          <span className="text-base font-bold font-mono text-gray-100 tracking-widest tabular-nums">
            {clock}
          </span>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Giờ ca</div>
        </div>
      </div>

      {/* ── Tabs + Actions ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <nav className="flex bg-kds-card rounded-lg p-1 border border-kds-border gap-0.5">
          <TabButton
            active={activeTab === 'live'}
            onClick={() => setActiveTab('live')}
            icon={<LayoutGrid size={15} />}
            label="Đơn Live"
            badge={waitingCount + cookingCount}
          />
          <TabButton
            active={activeTab === 'batching'}
            onClick={() => setActiveTab('batching')}
            icon={<BrainCircuit size={15} />}
            label="AI Batching"
            badge={batchingCount}
            badgeColor="bg-violet-500"
          />
          <TabButton
            active={activeTab === 'completed'}
            onClick={() => setActiveTab('completed')}
            icon={<CheckCircle2 size={15} />}
            label="Đã xong"
          />
        </nav>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-kds-card border border-kds-border text-gray-400 hover:text-gray-100 hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-kds-gold/40 focus:ring-offset-1 focus:ring-offset-kds-bg"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-gray-600" />}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Đăng xuất"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-kds-card border border-kds-border text-gray-400 hover:text-kds-redText hover:border-kds-redText/50 transition-colors focus:outline-none focus:ring-2 focus:ring-kds-redText/30 focus:ring-offset-1 focus:ring-offset-kds-bg"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatBoxProps {
  value: number;
  label: string;
  valueClass?: string;
}

const StatBox: React.FC<StatBoxProps> = ({ value, label, valueClass = 'text-gray-100' }) => (
  <div className="px-3 py-2 bg-kds-card rounded-lg border border-kds-border flex flex-col items-center justify-center min-w-[72px]">
    <span className={`text-xl font-bold tabular-nums leading-none ${valueClass}`}>{value}</span>
    <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{label}</span>
  </div>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: string;
}

const TabButton: React.FC<TabButtonProps> = ({
  active, onClick, icon, label, badge, badgeColor = 'bg-kds-gold',
}) => (
  <button
    onClick={onClick}
    className={`
      relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all
      focus:outline-none focus:ring-2 focus:ring-kds-gold/40 focus:ring-offset-1 focus:ring-offset-kds-card
      ${active
        ? 'bg-kds-gold text-black shadow-sm'
        : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-700/60'
      }
    `}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-[18px] text-center ${badgeColor} ${active ? 'bg-black/20 text-black' : 'text-white'}`}>
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);
