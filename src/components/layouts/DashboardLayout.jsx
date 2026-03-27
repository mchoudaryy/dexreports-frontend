import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reset scroll position when children change
  useEffect(() => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [children]);

  return (
    <div className="flex h-screen bg-[#f3efee] overflow-hidden relative">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <main className="px-2 py-2 md:px-8 bg-[#f3efee]">
          <Navbar setSidebarOpen={setSidebarOpen} />
        </main>
        <main className="flex-1 overflow-y-auto px-2 py-2 md:px-8 bg-[#f3efee] main-content">
          <div className="min-h-full rounded-xl bg-white shadow-md border border-slate-200 transition-all duration-300 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
