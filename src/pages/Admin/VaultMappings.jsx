import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Loader2,
  Edit2,
  Trash2,
  Building2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Copy,
} from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";

const BUCKETS = [
  { value: "company", label: "Company" },
  { value: "compound", label: "Compound" },
  { value: "extra", label: "Extra (vault 3+)" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const emptyForm = {
  multisigPda: "",
  label: "",
  bucket: "extra",
  status: "inactive",
  displayOrder: 100,
  notes: "",
};

export default function VaultMappings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});

  useEffect(() => {
    fetchRows();
  }, []);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const flashError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await ADMIN_API.ADMIN_GET_VAULT_MAPPINGS();
      setRows(res.data?.data || []);
    } catch (err) {
      console.error("fetchRows error", err);
      flashError(err.response?.data?.message || err.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({
      multisigPda: row.multisigPda,
      label: row.label,
      bucket: row.bucket,
      status: row.status,
      displayOrder: row.displayOrder ?? 100,
      notes: row.notes || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.multisigPda || !form.label) {
      return flashError("multisigPda and label are required");
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await ADMIN_API.ADMIN_UPDATE_VAULT_MAPPING(editingId, {
          label: form.label,
          bucket: form.bucket,
          status: form.status,
          displayOrder: Number(form.displayOrder) || 100,
          notes: form.notes,
        });
        flashSuccess("Vault mapping updated");
      } else {
        await ADMIN_API.ADMIN_ADD_VAULT_MAPPING(form);
        flashSuccess("Vault mapping added");
      }
      closeForm();
      await fetchRows();
    } catch (err) {
      console.error("submit error", err);
      flashError(err.response?.data?.message || err.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (row) => {
    try {
      await ADMIN_API.ADMIN_TOGGLE_VAULT_MAPPING(row._id);
      flashSuccess(
        `${row.label} is now ${row.status === "active" ? "inactive" : "active"}`
      );
      await fetchRows();
    } catch (err) {
      flashError(err.response?.data?.message || err.message || "Toggle failed");
    }
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `Delete vault mapping "${row.label}" (${row.multisigPda.slice(0, 6)}…)?\nHistorical data is kept; only the mapping row is removed.`
      )
    )
      return;
    try {
      await ADMIN_API.ADMIN_DELETE_VAULT_MAPPING(row._id);
      flashSuccess("Vault mapping deleted");
      await fetchRows();
    } catch (err) {
      flashError(err.response?.data?.message || err.message || "Delete failed");
    }
  };

  const copyAddress = async (addr) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopyFeedback({ [addr]: true });
      setTimeout(() => setCopyFeedback({}), 1500);
    } catch (e) {
      // ignore
    }
  };

  const truncate = (s) =>
    s && s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="text-indigo-500" /> Vault Mappings
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Maps each Squads multisig vault to a revenue bucket. Active vaults are
          synced from the pools-backend daily and shown in reports. Inactive
          vaults are skipped (no rows in modal, no $0 noise).
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Vault Mapping
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Label
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Bucket
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Multisig PDA
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  <Loader2 className="mx-auto animate-spin" size={20} />
                  <p className="mt-2 text-sm">Loading vault mappings…</p>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  <Building2 className="mx-auto text-gray-300" size={36} />
                  <p className="mt-2 text-sm font-medium">
                    No vault mappings yet
                  </p>
                  <p className="text-xs text-gray-400">
                    They'll auto-seed on the next daily sync, or add manually.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.displayOrder}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {row.label}
                    {row.notes && (
                      <p className="text-xs text-gray-400">{row.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                      {row.bucket}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyAddress(row.multisigPda)}
                      className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 hover:bg-gray-200"
                      title={row.multisigPda}
                    >
                      {truncate(row.multisigPda)}
                      {copyFeedback[row.multisigPda] ? (
                        <CheckCircle size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(row)}
                      className="inline-flex items-center gap-1 text-sm font-medium"
                      title="Click to toggle"
                    >
                      {row.status === "active" ? (
                        <>
                          <ToggleRight
                            size={28}
                            className="text-emerald-500"
                          />
                          <span className="text-emerald-700">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={28} className="text-gray-400" />
                          <span className="text-gray-500">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
                        className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Vault Mapping" : "Add Vault Mapping"}
              </h3>
              <button
                onClick={closeForm}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Multisig PDA <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.multisigPda}
                  onChange={(e) =>
                    setForm({ ...form, multisigPda: e.target.value.trim() })
                  }
                  disabled={!!editingId}
                  placeholder="e.g. HpGrGa8tE1wxgxaNEasb71SYmgXUdwU5U7ZzpbLWgAs"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
                />
                {editingId && (
                  <p className="mt-1 text-xs text-gray-400">
                    PDA cannot be changed. Delete and re-add to change it.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Compound 2"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Shown in the modal as "{(form.label || "VAULT").toUpperCase()}{" "}
                  REVENUE / LIQUIDITY"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bucket
                  </label>
                  <select
                    value={form.bucket}
                    onChange={(e) =>
                      setForm({ ...form, bucket: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {BUCKETS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({ ...form, displayOrder: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="optional"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="animate-spin" size={14} />
                  )}
                  {editingId ? "Save changes" : "Add mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
