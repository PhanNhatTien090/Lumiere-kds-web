import React from 'react';
interface HeaderProps {
    activeTab: 'live' | 'batching' | 'completed';
    setActiveTab: (tab: 'live' | 'batching' | 'completed') => void;
}
export declare const Header: React.FC<HeaderProps>;
export {};
//# sourceMappingURL=Header.d.ts.map