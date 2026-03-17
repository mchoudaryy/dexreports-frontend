import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, X, Loader2 } from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";

const initialFormState = {
  usdMin: "",
  usdMax: "",
  gasFeePercentage: "",
  tierFeePercentage: "",
  lpRewardPercentage: "",
  lpRewardPool: "",
  tipAmount: "",
  amount: "",
  ourWallet: "",
  status: true,
};

const Setting = () => {
  const [settings, setSettings] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [editingSetting, setEditingSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ADMIN_API.ADMIN_GET_SETTINGS();
      const data = response.data?.data;
      if (Array.isArray(data)) {
        setSettings(data);
      } else if (data) {
        setSettings([data]);
      } else {
        setSettings([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load settings");
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const activeSetting = useMemo(() => {
    if (!settings.length) return null;
    return settings.find((item) => item.status === true) || settings[0];
  }, [settings]);
  const activeCount = settings.filter((item) => item.status === true).length;
  const inactiveCount = settings.length - activeCount;
  const currentStatusAccent = activeSetting
    ? activeSetting.status
      ? "from-emerald-500 to-green-600"
      : "from-rose-500 to-red-600"
    : "from-gray-500 to-slate-600";

  const formatNumber = (value, minimumFractionDigits = 2, maximumFractionDigits = 2) => {
    if (value === undefined || value === null) return "--";
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  };

  const formatDate = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const mapSettingToForm = (setting) => ({
    usdMin: setting?.usdMin !== undefined && setting?.usdMin !== null ? String(setting.usdMin) : "",
    usdMax: setting?.usdMax !== undefined && setting?.usdMax !== null ? String(setting.usdMax) : "",
    gasFeePercentage:
      setting?.gasFeePercentage !== undefined && setting?.gasFeePercentage !== null
        ? String(setting.gasFeePercentage)
        : "",
    tierFeePercentage:
      setting?.tierFeePercentage !== undefined && setting?.tierFeePercentage !== null
        ? String(setting.tierFeePercentage)
        : "",
    lpRewardPercentage:
      setting?.lpRewardPercentage !== undefined && setting?.lpRewardPercentage !== null
        ? String(setting.lpRewardPercentage)
        : "",
    lpRewardPool:
      setting?.lpRewardPool !== undefined && setting?.lpRewardPool !== null
        ? String(setting.lpRewardPool)
        : "",
    tipAmount:
      setting?.tipAmount !== undefined && setting?.tipAmount !== null ? String(setting.tipAmount) : "",
    amount: setting?.amount !== undefined && setting?.amount !== null ? String(setting.amount) : "",
    ourWallet: setting?.ourWallet || "",
    status: setting?.status === true,
  });

  const handleOpenCreate = () => {
    setEditingSetting(null);
    setFormData(initialFormState);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleOpenEdit = (setting) => {
    setEditingSetting(setting);
    setFormData(mapSettingToForm(setting));
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const numericKeys = [
      "usdMin",
      "usdMax",
      "gasFeePercentage",
      "tierFeePercentage",
      "lpRewardPercentage",
      "lpRewardPool",
      "tipAmount",
      "amount",
    ];

    const payload = {};

    for (const key of numericKeys) {
      if (formData[key] === "") {
        setError("All fields are required");
        setSubmitting(false);
        return;
      }
      const parsedValue = Number(formData[key]);
      if (Number.isNaN(parsedValue)) {
        setError("Invalid numeric value");
        setSubmitting(false);
        return;
      }
      payload[key] = parsedValue;
    }

    if (formData.ourWallet === "") {
      setError("Wallet Address is required");
      setSubmitting(false);
      return;
    }

    payload.status = formData.status;
    payload.ourWallet = formData.ourWallet;

    if (editingSetting?._id) {
      payload.settingId = editingSetting._id;
    }

    try {
      const response = await ADMIN_API.ADMIN_CREATE_OR_UPDATE_SETTINGS(payload);
      if (response.data?.message) {
        setSuccess(response.data.message);
      }
      await fetchSettings();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    {
      title: "USD Range",
      value: activeSetting
        ? `${formatNumber(activeSetting.usdMin, 2, 2)} - ${formatNumber(activeSetting.usdMax, 2, 2)}`
        : "--",
      accent: "from-blue-500 to-cyan-600",
    },
    {
      title: "Gas Fee %",
      value: activeSetting ? formatNumber(activeSetting.gasFeePercentage, 6, 6) : "--",
      accent: "from-purple-500 to-pink-600",
    },
    {
      title: "LP Reward %",
      value: activeSetting ? formatNumber(activeSetting.lpRewardPercentage, 2, 2) : "--",
      accent: "from-emerald-500 to-green-600",
    },
    {
      title: "LP Reward Pool %",
      value: activeSetting ? formatNumber(activeSetting.lpRewardPool, 6, 6) : "--",
      accent: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/3 w-60 h-60 bg-cyan-200/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 mx-auto ">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-300"></div>
                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse delay-700"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse delay-1000"></div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-1">
                Platform Settings
              </h1>
              <p className="text-base text-gray-600 max-w-2xl">
                Manage fee configurations, rewards, and operational thresholds
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Plus size={20} />
              <span>Add Settings</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl hover:scale-105 transition-all duration-500"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-600 mb-2">
                  {stat.title}
                </span>
                <span className="text-3xl font-black text-gray-900">
                  {stat.value}
                </span>
              </div>
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.accent} mix-blend-multiply`}
              ></div>
            </div>
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-600">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : settings.length ? (
            <div className="space-y-6">
              {settings.map((setting) => (
                <div
                  key={setting._id}
                  className="group relative bg-white/50 backdrop-blur-sm border border-white/60 rounded-[2rem] p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700"></div>

                  <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 sm:gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">USD Min</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.usdMin, 2, 2)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">USD Max</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.usdMax, 2, 2)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Gas Fee %</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.gasFeePercentage, 6, 6)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Tier Fee %</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.tierFeePercentage, 2, 2)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">LP Reward %</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.lpRewardPercentage, 2, 2)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">LP Pool %</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.lpRewardPool, 6, 6)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Tip Amount</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.tipAmount, 6, 6)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Amount</p>
                      <p className="text-base font-black text-gray-800">{formatNumber(setting.amount, 2, 2)}</p>
                    </div>

                    <div className="space-y-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Deposit Address</p>
                      <p className="text-sm font-bold text-gray-700 break-all bg-gray-50/50 p-2 rounded-xl border border-gray-100">{setting.ourWallet || "Not set"}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Status</p>
                      <div className="pt-1">
                        <span
                          className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            setting.status
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 animate-pulse ${setting.status ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          {setting.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Created At</p>
                      <p className="text-[11px] font-bold text-gray-600 leading-relaxed">{formatDate(setting.createdAt)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Updated At</p>
                      <p className="text-[11px] font-bold text-gray-600 leading-relaxed">{formatDate(setting.updatedAt)}</p>
                    </div>

                    <div className="flex items-center xl:justify-end lg:col-span-1">
                      <button
                        onClick={() => handleOpenEdit(setting)}
                        className="group/btn relative flex items-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest"
                      >
                        <Edit2 size={16} className="transition-transform group-hover/btn:rotate-12" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <p className="text-gray-500 text-sm font-medium">
                No settings found. Create your first configuration to get started.
              </p>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Plus size={18} />
                <span>Add Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSetting ? "Update Settings" : "Create Settings"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                disabled={submitting}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="usdMin" className="text-sm font-semibold text-gray-700">
                    USD Min
                  </label>
                  <input
                    id="usdMin"
                    name="usdMin"
                    type="number"
                    step="0.01"
                    value={formData.usdMin}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="usdMax" className="text-sm font-semibold text-gray-700">
                    USD Max
                  </label>
                  <input
                    id="usdMax"
                    name="usdMax"
                    type="number"
                    step="0.01"
                    value={formData.usdMax}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="gasFeePercentage" className="text-sm font-semibold text-gray-700">
                    Gas Fee Percentage
                  </label>
                  <input
                    id="gasFeePercentage"
                    name="gasFeePercentage"
                    type="number"
                    step="0.000001"
                    value={formData.gasFeePercentage}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="tierFeePercentage" className="text-sm font-semibold text-gray-700">
                    Tier Fee Percentage
                  </label>
                  <input
                    id="tierFeePercentage"
                    name="tierFeePercentage"
                    type="number"
                    step="0.01"
                    value={formData.tierFeePercentage}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="lpRewardPercentage" className="text-sm font-semibold text-gray-700">
                    LP Reward Percentage
                  </label>
                  <input
                    id="lpRewardPercentage"
                    name="lpRewardPercentage"
                    type="number"
                    step="0.01"
                    value={formData.lpRewardPercentage}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="lpRewardPool" className="text-sm font-semibold text-gray-700">
                    LP Reward Pool Percentage
                  </label>
                  <input
                    id="lpRewardPool"
                    name="lpRewardPool"
                    type="number"
                    step="0.000001"
                    value={formData.lpRewardPool}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="tipAmount" className="text-sm font-semibold text-gray-700">
                    Tip Amount
                  </label>
                  <input
                    id="tipAmount"
                    name="tipAmount"
                    type="number"
                    step="0.000001"
                    value={formData.tipAmount}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                    Amount
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label htmlFor="ourWallet" className="text-sm font-semibold text-gray-700">
                    Deposit Address
                  </label>
                  <input
                    id="ourWallet"
                    name="ourWallet"
                    type="text"
                    placeholder="Enter wallet address"
                    value={formData.ourWallet}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    disabled={submitting}
                  />
                </div>
                <div className="flex items-center justify-between md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-700">Status</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleInputChange}
                      className="peer sr-only"
                      disabled={submitting}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingSetting ? "Update Settings" : "Create Settings"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setting;
