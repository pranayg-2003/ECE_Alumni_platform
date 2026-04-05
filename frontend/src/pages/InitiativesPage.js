import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import EventPublishWizard from "../components/initiatives/EventPublishWizard";
import { useAuth } from "../context/AuthContext";
import {
  fetchFundingCampaigns,
  fetchAlumniEvents,
  createFundingCampaign,
  updateFundingCampaign,
  deleteFundingCampaign,
  createAlumniEvent,
  updateAlumniEvent,
  deleteAlumniEvent,
  fetchRazorpayMeta,
  createFundingPayOrder,
  verifyFundingPay,
} from "../utils/api";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { toastApiError } from "../utils/toast";
import toast from "react-hot-toast";

const IconSpark = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

const IconCalendar = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
    />
  </svg>
);

const PRESET_AMOUNTS = [101, 501, 1001, 2501, 5100];

const isOwner = (user, doc) => {
  if (!user || !doc?.createdBy) return false;
  const oid = doc.createdBy._id ?? doc.createdBy;
  return String(oid) === String(user.id);
};

const canOrganize = (user) => user && (user.role === "alumni" || user.role === "admin");

const canUseRazorpay = (c, razorpayEnabled) =>
  razorpayEnabled &&
  c?.isActive &&
  c?.acceptRazorpay !== false &&
  String(c?.currency || "INR").toUpperCase() === "INR";

const InitiativesPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("funding");
  const [funding, setFunding] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);

  const [fundModal, setFundModal] = useState(null);
  const [fundForm, setFundForm] = useState({
    title: "",
    description: "",
    goalAmount: "",
    raisedAmount: "",
    currency: "INR",
    externalUrl: "",
    acceptRazorpay: true,
    isActive: true,
  });

  const [eventWizardOpen, setEventWizardOpen] = useState(false);
  const [eventWizardEditId, setEventWizardEditId] = useState(null);
  const [eventWizardInitial, setEventWizardInitial] = useState(null);
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const [donateCampaign, setDonateCampaign] = useState(null);
  const [donateAmount, setDonateAmount] = useState("501");
  const [donateBusy, setDonateBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, eRes, rz] = await Promise.all([
        fetchFundingCampaigns(),
        fetchAlumniEvents(),
        fetchRazorpayMeta().catch(() => ({ data: { enabled: false } })),
      ]);
      setFunding(fRes.data || []);
      setEvents(eRes.data || []);
      setRazorpayEnabled(!!rz.data?.enabled);
    } catch (e) {
      toastApiError(e, "Could not load initiatives.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateFunding = () => {
    setFundForm({
      title: "",
      description: "",
      goalAmount: "",
      raisedAmount: "0",
      currency: "INR",
      externalUrl: "",
      acceptRazorpay: true,
      isActive: true,
    });
    setFundModal("create");
  };

  const openEditFunding = (c) => {
    setFundForm({
      title: c.title || "",
      description: c.description || "",
      goalAmount: c.goalAmount != null ? String(c.goalAmount) : "",
      raisedAmount: String(c.raisedAmount ?? 0),
      currency: c.currency || "INR",
      externalUrl: c.externalUrl || "",
      acceptRazorpay: c.acceptRazorpay !== false,
      isActive: !!c.isActive,
    });
    setFundModal(c._id);
  };

  const saveFunding = async () => {
    try {
      const parseNum = (v, fallback = null) => {
        if (v === "" || v === undefined) return fallback;
        const n = Number(v);
        return Number.isNaN(n) ? fallback : n;
      };
      const payload = {
        title: fundForm.title,
        description: fundForm.description,
        goalAmount: parseNum(fundForm.goalAmount, null),
        raisedAmount: parseNum(fundForm.raisedAmount, 0) ?? 0,
        currency: fundForm.currency,
        externalUrl: fundForm.externalUrl,
        acceptRazorpay: fundForm.acceptRazorpay,
        isActive: fundForm.isActive,
      };
      if (fundModal === "create") {
        await createFundingCampaign(payload);
        toast.success("Campaign published.");
      } else {
        await updateFundingCampaign(fundModal, payload);
        toast.success("Campaign updated.");
      }
      setFundModal(null);
      load();
    } catch (e) {
      toastApiError(e, "Could not save campaign.");
    }
  };

  const removeFunding = async (id) => {
    if (!window.confirm("Remove this funding campaign?")) return;
    try {
      await deleteFundingCampaign(id);
      toast.success("Removed.");
      load();
    } catch (e) {
      toastApiError(e, "Could not remove.");
    }
  };

  const openCreateEvent = () => {
    setEventWizardEditId(null);
    setEventWizardInitial(null);
    setEventWizardOpen(true);
  };

  const openEditEvent = (ev) => {
    setEventWizardEditId(ev._id);
    setEventWizardInitial(ev);
    setEventWizardOpen(true);
  };

  const closeEventWizard = () => {
    setEventWizardOpen(false);
    setEventWizardEditId(null);
    setEventWizardInitial(null);
  };

  const handleEventPublish = async (payload) => {
    setEventSubmitting(true);
    try {
      if (eventWizardEditId) {
        await updateAlumniEvent(eventWizardEditId, payload);
        toast.success("Event updated.");
      } else {
        await createAlumniEvent(payload);
        toast.success("Event published.");
      }
      closeEventWizard();
      load();
    } catch (e) {
      toastApiError(e, "Could not save event.");
    } finally {
      setEventSubmitting(false);
    }
  };

  const removeEvent = async (id) => {
    if (!window.confirm("Remove this event?")) return;
    try {
      await deleteAlumniEvent(id);
      toast.success("Removed.");
      load();
    } catch (e) {
      toastApiError(e, "Could not remove.");
    }
  };

  const openDonate = (c) => {
    setDonateCampaign(c);
    setDonateAmount("501");
  };

  const runRazorpayCheckout = async () => {
    if (!donateCampaign) return;
    const rupees = Number(donateAmount);
    if (!Number.isFinite(rupees) || rupees < 1) {
      toast.error("Enter a valid amount (min ₹1).");
      return;
    }
    setDonateBusy(true);
    try {
      await loadRazorpayScript();
      const orderRes = await createFundingPayOrder(donateCampaign._id, rupees);
      if (!orderRes.success || !orderRes.data?.orderId) {
        throw new Error(orderRes.message || "Could not create order.");
      }
      const { keyId, orderId, amount, currency } = orderRes.data;
      setDonateBusy(false);

      const options = {
        key: keyId,
        amount,
        currency,
        name: "MentorBridge",
        description: donateCampaign.title,
        order_id: orderId,
        handler: (response) => {
          (async () => {
            try {
              const v = await verifyFundingPay(donateCampaign._id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (v.success) {
                toast.success(v.duplicate ? "Already recorded." : "Thank you for contributing.");
                setDonateCampaign(null);
                load();
              }
            } catch (err) {
              toastApiError(err, "Payment verification failed.");
            }
          })();
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#0071e3" },
        modal: {
          ondismiss: () => {},
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      toastApiError(e, e.message || "Could not start checkout.");
      setDonateBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-black/[0.08] bg-[#f5f5f7] px-3.5 py-2.5 text-[15px] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15";

  const fundForQuick = funding.filter((c) => canUseRazorpay(c, razorpayEnabled));

  return (
    <div className="dashboard-apple-bg font-apple min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        <header className="relative mb-10 overflow-hidden rounded-[28px] border border-black/[0.06] bg-white/70 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:px-10 sm:py-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#0071e3]/[0.12] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#5e5ce6]/[0.1] blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0071e3]">Community</p>
            <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[40px]">
              Initiatives
            </h1>
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-neutral-600 sm:text-[18px]">
              Fund college programs with secure Razorpay checkout, and host live sessions on Google Meet — all in one
              place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-4 py-2 text-[13px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Secure payments
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-4 py-2 text-[13px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06]">
                <span className="h-2 w-2 rounded-full bg-[#0071e3]" aria-hidden />
                Meet links
              </span>
            </div>
          </div>
        </header>

        <div className="mb-8 flex flex-wrap gap-2 rounded-[20px] border border-black/[0.08] bg-gradient-to-b from-[#f5f5f7] to-[#f5f5f7]/80 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setTab("funding")}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-[14px] px-5 py-3.5 text-[15px] font-semibold transition sm:flex-none ${
              tab === "funding"
                ? "bg-white text-[#1d1d1f] shadow-[0_4px_24px_rgba(0,113,227,0.12)] ring-2 ring-[#0071e3]/25"
                : "text-neutral-600 hover:bg-white/80 hover:text-[#1d1d1f]"
            }`}
          >
            <IconSpark />
            College funding
          </button>
          <button
            type="button"
            onClick={() => setTab("events")}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-[14px] px-5 py-3.5 text-[15px] font-semibold transition sm:flex-none ${
              tab === "events"
                ? "bg-white text-[#1d1d1f] shadow-[0_4px_24px_rgba(0,113,227,0.12)] ring-2 ring-[#0071e3]/25"
                : "text-neutral-600 hover:bg-white/80 hover:text-[#1d1d1f]"
            }`}
          >
            <IconCalendar />
            Alumni events
          </button>
        </div>

        {tab === "funding" && user?.role === "alumni" && fundForQuick.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-[20px] border border-[#0071e3]/20 bg-gradient-to-br from-[#0071e3]/[0.07] to-[#5e5ce6]/[0.06] p-4 sm:p-5">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#0071e3]">Alumni quick give</p>
            <p className="mt-1 text-[15px] font-medium text-[#1d1d1f]">Tap an amount, pick a campaign, pay in seconds.</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setDonateAmount(String(amt));
                    if (fundForQuick.length === 1) openDonate(fundForQuick[0]);
                  }}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#1d1d1f] shadow-sm ring-1 ring-black/[0.06] transition hover:ring-[#0071e3]/40"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
            {fundForQuick.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {fundForQuick.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      openDonate(c);
                    }}
                    className="max-w-[200px] truncate rounded-full border border-black/[0.1] bg-white/90 px-3 py-1.5 text-left text-[12px] font-medium text-[#1d1d1f] hover:border-[#0071e3]/35"
                    title={c.title}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}
            {fundForQuick.length === 1 && (
              <button
                type="button"
                onClick={() => openDonate(fundForQuick[0])}
                className="mt-3 rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#0077ed]"
              >
                Contribute now
              </button>
            )}
          </div>
        )}

        {canOrganize(user) && tab === "funding" && (
          <button
            type="button"
            onClick={openCreateFunding}
            className="mb-8 w-full rounded-full bg-[#0071e3] py-3.5 text-[16px] font-semibold text-white shadow-[0_8px_30px_rgba(0,113,227,0.35)] transition hover:bg-[#0077ed] active:scale-[0.99] sm:w-auto sm:px-10"
          >
            New funding campaign
          </button>
        )}

        {canOrganize(user) && tab === "events" && (
          <button
            type="button"
            onClick={openCreateEvent}
            className="mb-8 w-full rounded-full bg-[#0071e3] py-3.5 text-[16px] font-semibold text-white shadow-[0_8px_30px_rgba(0,113,227,0.35)] transition hover:bg-[#0077ed] active:scale-[0.99] sm:w-auto sm:px-10"
          >
            Publish Meet event
          </button>
        )}

        {!razorpayEnabled && tab === "funding" && (
          <p className="mb-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-[13px] text-amber-900">
            Razorpay is not configured on the server. Add <span className="font-mono">RAZORPAY_KEY_ID</span> and{" "}
            <span className="font-mono">RAZORPAY_KEY_SECRET</span> to enable UPI / card payments.
          </p>
        )}

        {loading ? (
          <p className="text-[15px] text-neutral-500">Loading…</p>
        ) : tab === "funding" ? (
          <ul className="space-y-5">
            {funding.length === 0 ? (
              <li className="apple-glass-card rounded-[24px] p-10 text-center text-[16px] leading-relaxed text-neutral-500">
                No funding campaigns yet.
                {canOrganize(user) && " Create one to collect contributions for the college."}
              </li>
            ) : (
              funding.map((c) => {
                const goal = c.goalAmount != null && c.goalAmount > 0;
                const pct = goal ? Math.min(100, Math.round(((c.raisedAmount || 0) / c.goalAmount) * 100)) : null;
                const manage = user && (user.role === "admin" || isOwner(user, c));
                const showRzp = canUseRazorpay(c, razorpayEnabled);
                return (
                  <li
                    key={c._id}
                    className="apple-glass-card group overflow-hidden rounded-[24px] p-5 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[22px]">
                            {c.title}
                          </h2>
                          {!c.isActive && (
                            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              Inactive
                            </span>
                          )}
                          {showRzp && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                              Razorpay
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] text-neutral-500">
                          By {c.createdBy?.name || "Organizer"}
                          {c.createdBy?.company ? ` · ${c.createdBy.company}` : ""}
                        </p>
                        {c.description ? (
                          <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-neutral-700">
                            {c.description}
                          </p>
                        ) : null}
                        {goal && (
                          <div className="mt-5">
                            <div className="mb-2 flex justify-between text-[13px] font-semibold text-neutral-600">
                              <span>
                                Raised {c.currency || "INR"} {(c.raisedAmount ?? 0).toLocaleString()}
                              </span>
                              <span>Goal {c.goalAmount.toLocaleString()}</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-[#e8e8ed] ring-1 ring-black/[0.05]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#0071e3] to-[#2997ff] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {!goal && (c.raisedAmount ?? 0) > 0 && (
                          <p className="mt-3 text-[14px] text-neutral-600">
                            Raised: {c.currency || "INR"} {(c.raisedAmount ?? 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                        {showRzp && (
                          <button
                            type="button"
                            onClick={() => openDonate(c)}
                            className="inline-flex items-center justify-center rounded-full bg-[#0071e3] px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#0077ed]"
                          >
                            Pay with Razorpay
                          </button>
                        )}
                        {c.externalUrl ? (
                          <a
                            href={c.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-black/[0.12] bg-white px-5 py-2.5 text-[14px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                          >
                            Other link
                          </a>
                        ) : null}
                        {manage && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditFunding(c)}
                              className="rounded-full border border-black/[0.12] px-4 py-2 text-[13px] font-medium text-[#0071e3]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFunding(c._id)}
                              className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
          <ul className="space-y-5">
            {events.length === 0 ? (
              <li className="apple-glass-card rounded-[24px] p-10 text-center text-[16px] leading-relaxed text-neutral-500">
                No events scheduled.
                {canOrganize(user) && " Use the guided publisher to add a Google Meet event."}
              </li>
            ) : (
              events.map((ev) => {
                const manage = user && (user.role === "admin" || isOwner(user, ev));
                const start = ev.startsAt ? new Date(ev.startsAt) : null;
                const end = ev.endsAt ? new Date(ev.endsAt) : null;
                return (
                  <li
                    key={ev._id}
                    className="apple-glass-card group overflow-hidden rounded-[24px] p-5 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 gap-4">
                        {start && !Number.isNaN(start.getTime()) ? (
                          <div className="hidden shrink-0 flex-col items-center justify-center rounded-2xl bg-[#0071e3]/10 px-3 py-2 text-center ring-1 ring-[#0071e3]/20 sm:flex sm:min-w-[4.5rem]">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071e3]">
                              {start.toLocaleString("en", { month: "short" })}
                            </span>
                            <span className="text-[22px] font-semibold leading-none text-[#1d1d1f]">
                              {start.getDate()}
                            </span>
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[22px]">
                            {ev.title}
                          </h2>
                          {ev.status === "cancelled" && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                              Cancelled
                            </span>
                          )}
                          {ev.status === "completed" && (
                            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] text-neutral-500">
                          Host: {ev.createdBy?.name || "Alumni"}
                        </p>
                        {start && (
                          <p className="mt-2 text-[14px] font-medium text-[#1d1d1f]">
                            {start.toLocaleString()}
                            {end && !Number.isNaN(end.getTime()) ? ` – ${end.toLocaleTimeString()}` : ""}
                          </p>
                        )}
                        {ev.description ? (
                          <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-neutral-700">
                            {ev.description}
                          </p>
                        ) : null}
                        </div>
                      </div>
                      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
                        {ev.status === "scheduled" && ev.googleMeetLink ? (
                          <a
                            href={ev.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(0,113,227,0.3)] transition hover:bg-[#0077ed]"
                          >
                            Join Google Meet
                          </a>
                        ) : ev.googleMeetLink ? (
                          <span className="text-[13px] text-neutral-400">Meet link on file</span>
                        ) : null}
                        {manage && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditEvent(ev)}
                              className="rounded-full border border-black/[0.12] bg-white px-4 py-2 text-[14px] font-medium text-[#0071e3] transition hover:bg-[#f5f5f7]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEvent(ev._id)}
                              className="rounded-full border border-red-200 bg-white px-4 py-2 text-[14px] font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      <EventPublishWizard
        open={eventWizardOpen}
        editingId={eventWizardEditId}
        initial={eventWizardInitial}
        onClose={closeEventWizard}
        onPublish={handleEventPublish}
        submitting={eventSubmitting}
      />

      {donateCampaign && (
        <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl">
            <h3 className="text-[18px] font-semibold text-[#1d1d1f]">Contribute</h3>
            <p className="mt-1 text-[14px] text-neutral-600">{donateCampaign.title}</p>
            <p className="mt-4 text-[12px] font-medium text-neutral-500">Amount (INR)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setDonateAmount(String(a))}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${
                    donateAmount === String(a)
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f] ring-1 ring-black/[0.06]"
                  }`}
                >
                  ₹{a}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              className={`${inputClass} mt-3`}
              value={donateAmount}
              onChange={(e) => setDonateAmount(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDonateCampaign(null)}
                className="rounded-full px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-black/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={donateBusy}
                onClick={runRazorpayCheckout}
                className="rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
              >
                {donateBusy ? "Please wait…" : "Continue to Razorpay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(fundModal === "create" || (fundModal && fundModal !== "create")) && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-black/[0.08] bg-white p-6 shadow-2xl"
            role="dialog"
            aria-labelledby="fund-modal-title"
          >
            <h3 id="fund-modal-title" className="text-[20px] font-semibold text-[#1d1d1f]">
              {fundModal === "create" ? "New funding campaign" : "Edit campaign"}
            </h3>
            <div className="mt-4 space-y-3">
              <input
                className={inputClass}
                placeholder="Title"
                value={fundForm.title}
                onChange={(e) => setFundForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className={`${inputClass} min-h-[100px] resize-none`}
                placeholder="Describe the cause and how funds will be used…"
                value={fundForm.description}
                onChange={(e) => setFundForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  placeholder="Goal (optional)"
                  value={fundForm.goalAmount}
                  onChange={(e) => setFundForm((f) => ({ ...f, goalAmount: e.target.value }))}
                />
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  placeholder="Raised so far"
                  value={fundForm.raisedAmount}
                  onChange={(e) => setFundForm((f) => ({ ...f, raisedAmount: e.target.value }))}
                />
              </div>
              <input
                className={inputClass}
                placeholder="Currency (e.g. INR)"
                value={fundForm.currency}
                onChange={(e) => setFundForm((f) => ({ ...f, currency: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-[14px] text-neutral-700">
                <input
                  type="checkbox"
                  checked={fundForm.acceptRazorpay}
                  onChange={(e) => setFundForm((f) => ({ ...f, acceptRazorpay: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                Accept UPI / card via Razorpay (INR only)
              </label>
              <input
                className={inputClass}
                placeholder="Optional: other contribution link (https://…)"
                value={fundForm.externalUrl}
                onChange={(e) => setFundForm((f) => ({ ...f, externalUrl: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-[14px] text-neutral-700">
                <input
                  type="checkbox"
                  checked={fundForm.isActive}
                  onChange={(e) => setFundForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                Visible to students
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFundModal(null)}
                className="rounded-full px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-black/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFunding}
                className="rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#0077ed]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InitiativesPage;
