import { useState } from "react";

const Profile = () => {
  const [admin] = useState({
    name: "John Doe",
    role: "Analytics Dashboard Controller",
    email: "analytics.admin@dex.com",
    avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Admin",
    stats: {
      activeUsers: 2450,
      dashboards: 15,
      dataPoints: "1.2M",
    },
    permissions: [
      "Dashboard Management",
      "Data Analytics",
      "Report Generation",
      "User Metrics",
      "Real-time Monitoring",
    ],
    lastActive: "2025-10-23 09:30 AM",
    status: "Online",
    recentDashboards: [
      { name: "User Engagement", status: "Live" },
      { name: "Revenue Analytics", status: "Active" },
      { name: "Performance Metrics", status: "Updating" },
    ],
  });

  return (
    <div className=" bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-600 relative">
            <div className="absolute bottom-4 left-6 flex items-center space-x-3">
              <span className="bg-emerald-500 px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                {admin.status}
              </span>
              <span className="text-white text-sm">
                Last Active: {admin.lastActive}
              </span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center">
              {/* Avatar */}
              <div className="relative -mt-16">
                <img
                  src={admin.avatar}
                  alt="Admin Profile"
                  className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg"
                />
                <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>

              {/* Admin Details */}
              <div className="mt-6 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-800">
                  {admin.name}
                </h2>
                <p className="text-blue-600 font-semibold">{admin.role}</p>
                <p className="text-gray-500 text-sm mt-1">{admin.email}</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 sm:mt-0 sm:ml-auto space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Manage Dashboards
                </button>
                <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Analytics Settings
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg text-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {admin.stats.activeUsers}
                </h3>
                <p className="text-gray-600">Active Users</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg text-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {admin.stats.dashboards}
                </h3>
                <p className="text-gray-600">Active Dashboards</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg text-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {admin.stats.dataPoints}
                </h3>
                <p className="text-gray-600">Data Points</p>
              </div>
            </div>

            {/* Recent Dashboards */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Dashboards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {admin.recentDashboards.map((dashboard, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">
                        {dashboard.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          dashboard.status === "Live"
                            ? "bg-green-100 text-green-800"
                            : dashboard.status === "Active"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {dashboard.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Controller Access
              </h3>
              <div className="flex flex-wrap gap-2">
                {admin.permissions.map((permission, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>

            {/* Overview */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Analytics Overview
              </h3>
              <p className="text-gray-600">
                Lead analytics dashboard controller responsible for monitoring
                and managing real-time data analytics, user engagement metrics,
                and performance monitoring systems. Specializes in data
                visualization and interactive dashboard development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
