import { useEffect, useState } from "react";
import { ADMIN_API } from "../../services/ApiHandlers";
import * as XLSX from 'xlsx';
import { Edit2, Trash2, Users, CheckCircle, XCircle } from "lucide-react";

const initialFormState = {
  username: "",
  email: "",
  role: "superadmin",
  isActive: true,
};

const Usermanagement = () => {
  const handleDownloadExcel = async () => {
    try {
      // Get total count first
      const firstResponse = await ADMIN_API.ADMIN_GET_USERS({ page: 1, limit: 1 });
      const totalCount = firstResponse?.data?.count || firstResponse?.data?.totalRecords || 0;
      // Fetch all users
      const response = await ADMIN_API.ADMIN_GET_USERS({ page: 1, limit: totalCount });
      const userData = response?.data?.data || [];
      const data = userData.map((u, idx) => ({
        SNo: idx + 1,
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Status: u.status,
        Created: u.createdAt,
        Updated: u.updatedAt,
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, 'users.xlsx');
    } catch (err) {
      alert('Failed to download Excel. Please try again.');
    }
  };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [formValues, setFormValues] = useState(initialFormState);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const fetchUsers = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const response = await ADMIN_API.ADMIN_GET_USERS({ page, limit });
      const {
        data: userData = [],
        count,
        totalPages,
        currentPage,
        limit: responseLimit,
      } = response?.data || {};
      const list = Array.isArray(userData) ? userData : [];
      setUsers(list);
      setPagination((prev) => ({
        ...prev,
        count: count ?? prev.count,
        totalPages: totalPages && totalPages > 0 ? totalPages : prev.totalPages,
        currentPage: currentPage ?? page,
        limit: responseLimit ?? limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setEditingUserId(null);
    setFormValues(initialFormState);
  };

  const handleEditClick = (user) => {
    setError("");
    setSuccess("");
    setEditingUserId(user._id);
    setFormValues({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "superadmin",
      isActive: user.isActive ?? true,
    });
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async () => {
    if (!editingUserId) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await ADMIN_API.ADMIN_UPDATE_USER(editingUserId, formValues);
      console.log(response,"response");
      
      const updatedUser = response?.data?.data;
      console.log(response?.data?.data,"response?.data?.data");
      
      if (updatedUser) {
        setUsers((prev) =>
          prev.map((user) => (user._id === editingUserId ? { ...user, ...updatedUser } : user))
        );
        setSuccess("User updated successfully");
      } else {
        await fetchUsers();
        setSuccess("User updated successfully");
      }
      resetForm();
    } catch (err) {
      console.error("Update error:", err);
      setError(err?.response?.data?.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    const newStatus = !user.isActive;
    try {
      const response = await ADMIN_API.ADMIN_UPDATE_USER(user._id, { isActive: newStatus });
      const updatedUser = response?.data?.data;
      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? { ...item, ...(updatedUser || {}), isActive: newStatus }
            : item
        )
      );
      if (editingUserId === user._id) {
        setFormValues((prev) => ({ ...prev, isActive: newStatus }));
      }
      setSuccess(newStatus ? "User activated successfully" : "User deactivated successfully");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await ADMIN_API.ADMIN_DELETE_USER(userId);
      const nextCount = Math.max(pagination.count - 1, 0);
      const nextTotalPages = nextCount === 0 ? 1 : Math.ceil(nextCount / pagination.limit);
      const nextPage = nextCount === 0 ? 1 : Math.min(pagination.currentPage, nextTotalPages);
      await fetchUsers(nextPage);
      if (editingUserId === userId) {
        resetForm();
      }
      setSuccess("User deleted successfully");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) {
      return;
    }
    fetchUsers(page);
  };

  const renderDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  const totalUsers = pagination.count;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  const StatCard = ({ title, value, icon: Icon, bgColor, iconBgColor }) => (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconBgColor}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header with colored dots */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Stat Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={Users}
            iconBgColor="bg-blue-500"
          />
          <StatCard
            title="Active Users"
            value={activeUsers}
            icon={CheckCircle}
            iconBgColor="bg-green-500"
          />
          <StatCard
            title="Inactive Users"
            value={inactiveUsers}
            icon={XCircle}
            iconBgColor="bg-purple-500"
          />
        </div>
      )}

      {/* Users Table Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          All Users ({totalUsers})
        </h2>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    S.No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user, index) => {
                  const isEditing = editingUserId === user._id;
                  return (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {(pagination.currentPage - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            name="username"
                            value={formValues.username}
                            onChange={handleInputChange}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="font-medium">{user.username || "-"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {isEditing ? (
                          <input
                            name="email"
                            value={formValues.email}
                            onChange={handleInputChange}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          user.email || "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {isEditing ? (
                          <select
                            name="role"
                            value={formValues.role}
                            onChange={handleInputChange}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium capitalize">
                            {user.role || "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={!!formValues.isActive}
                              onChange={handleInputChange}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            Active
                          </label>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading}
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold transition ${
                              user.isActive
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-red-50 text-red-700 hover:bg-red-100"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {renderDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {renderDate(user.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={handleUpdate}
                              disabled={actionLoading}
                              className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={actionLoading}
                              className="px-4 py-2 rounded-md bg-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(user)}
                              disabled={actionLoading}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit user"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              disabled={actionLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete user"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination.count > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div className="text-sm text-gray-600">
              Showing
              <span className="font-semibold text-gray-900 mx-1">
                {(pagination.currentPage - 1) * pagination.limit + 1}
              </span>
              to
              <span className="font-semibold text-gray-900 mx-1">
                {Math.min(pagination.currentPage * pagination.limit, pagination.count)}
              </span>
              of
              <span className="font-semibold text-gray-900 mx-1">
                {pagination.count}
              </span>
              users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
                className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold transition-colors duration-200 ${pagination.currentPage === 1 || loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${pagination.currentPage === page
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || loading}
                className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold transition-colors duration-200 ${pagination.currentPage === pagination.totalPages || loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usermanagement;
