import { StatCard } from "../../components/Cards/StatCard";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Users",
      value: 15420,
      previousValue: 14200,
      percentageChange: 8.6,
      variant: "primary",
    },
    {
      title: "Total Networks",
      value: 12,
      previousValue: 10,
      percentageChange: 20.0,
      variant: "blue",
    },
    {
      title: "Total Tokens",
      value: 2450,
      previousValue: 2100,
      percentageChange: 16.7,
      variant: "green",
    },
    {
      title: "Total Transactions",
      value: 85420,
      previousValue: 72000,
      percentageChange: 18.6,
      variant: "orange",
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10">
      {/* Enhanced Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/3 w-60 h-60 bg-cyan-200/15 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-amber-200/10 rounded-full blur-xl animate-pulse delay-1500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 mx-auto">
        {/* Enhanced Header */}
        <div className="mb-4 sm:mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-300"></div>
                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse delay-700"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse delay-1000"></div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-1">
                Admin Dashboard
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Manage users, networks, and platform analytics
              </p>
            </div>

            <div className="flex items-center justify-center lg:justify-end gap-4">
              <div className="flex items-center gap-3 px-6 py-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/30"></div>
                <span className="text-lg font-semibold text-gray-700">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-6 sm:gap-7 md:gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-8 sm:mb-10 md:mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="animate-in fade-in slide-in-from-bottom-8 duration-700"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                previousValue={stat.previousValue}
                percentageChange={stat.percentageChange}
                variant={stat.variant}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
