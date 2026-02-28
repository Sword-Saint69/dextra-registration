export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
            {/* Admin Top Navigation */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-white/10 bg-[#121212] px-6 py-4">
                <div className="flex items-center gap-4 text-white">
                    <div className="flex items-center justify-center size-8 rounded bg-gradient-to-br from-accent-red to-accent-gold text-white shadow-[0_0_10px_rgba(198,166,100,0.5)]">
                        <span className="material-symbols-outlined !text-[20px]">admin_panel_settings</span>
                    </div>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] font-display">
                        DEXTRA Admin
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        System Online
                    </div>
                    <button className="text-white/60 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </header>

            {/* Main Admin Content Wrapper, children will render the page.tsx inside */}
            <main className="flex-1 overflow-x-hidden p-6 md:p-10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-red/5 to-accent-gold/5 pointer-events-none"></div>
                <div className="relative z-10 max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
