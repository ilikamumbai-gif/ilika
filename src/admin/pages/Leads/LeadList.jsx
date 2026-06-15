import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, Smartphone } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getApiUrl } from "../../../utils/api";

const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not Interested" },
];

const formatDate = (value) => {
  if (!value) return "-";
  if (value?._seconds) {
    return new Date(value._seconds * 1000).toLocaleString("en-IN");
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString("en-IN");
};

const parseApiResponse = async (res) => {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { data, text };
};

const statusClasses = {
  new: "bg-[#fff1f6] text-[#b24074]",
  contacted: "bg-[#fff7e8] text-[#a86b16]",
  converted: "bg-[#eefaf1] text-[#1d7a46]",
  not_interested: "bg-[#f3f4f6] text-[#4b5563]",
};

const LeadList = () => {
  const { getAdminAuthHeaders } = useAdminAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [offerFilter, setOfferFilter] = useState("");
  const [updatingLeadId, setUpdatingLeadId] = useState("");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl("/api/leads"), {
        headers: {
          ...getAdminAuthHeaders(),
        },
      });
      const { data, text } = await parseApiResponse(res);

      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Leads API route not found." : data?.error || "Failed to fetch leads");
      }

      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch leads failed:", error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const offerOptions = useMemo(
    () =>
      Array.from(new Set(leads.map((lead) => String(lead.offerName || "").trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !term ||
        String(lead.mobileNumber || "").toLowerCase().includes(term) ||
        String(lead.pageUrl || "").toLowerCase().includes(term);

      const matchesStatus =
        !statusFilter || String(lead.status || "new").toLowerCase() === statusFilter;

      const matchesOffer =
        !offerFilter || String(lead.offerName || "") === offerFilter;

      return matchesSearch && matchesStatus && matchesOffer;
    });
  }, [leads, offerFilter, search, statusFilter]);

  const updateLeadStatus = async (leadId, nextStatus) => {
    if (!leadId || !nextStatus) return;

    try {
      setUpdatingLeadId(leadId);
      const res = await fetch(getApiUrl(`/api/leads/${leadId}/status`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Lead status API route not found." : data?.error || "Failed to update lead status");
      }

      setLeads((current) =>
        current.map((lead) => (lead.id === leadId ? { ...lead, ...data } : lead))
      );
    } catch (error) {
      console.error("Update lead status failed:", error);
      alert(error?.message || "Unable to update lead status");
    } finally {
      setUpdatingLeadId("");
    }
  };

  const exportCsv = () => {
    const rows = filteredLeads.map((lead) => ({
      mobileNumber: lead.mobileNumber || "",
      offerName: lead.offerName || "",
      couponValue: lead.couponValue || "",
      source: lead.source || "",
      pageUrl: lead.pageUrl || "",
      status: lead.status || "",
      createdAt: formatDate(lead.createdAt),
    }));

    const headers = ["Mobile Number", "Offer Name", "Coupon Value", "Source", "Page URL", "Status", "Created At"];
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.mobileNumber,
          row.offerName,
          row.couponValue,
          row.source,
          row.pageUrl,
          row.status,
          row.createdAt,
        ]
          .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ilika-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      label: "Mobile Number",
      key: "mobileNumber",
      render: (lead) => <span className="font-semibold text-[#111111]">{lead.mobileNumber || "-"}</span>,
    },
    {
      label: "Offer Name",
      key: "offerName",
      render: (lead) => <span className="text-sm text-gray-700">{lead.offerName || "-"}</span>,
    },
    {
      label: "Coupon Value",
      key: "couponValue",
      render: (lead) => <span className="font-medium text-[#b24074]">{lead.couponValue || "-"}</span>,
    },
    {
      label: "Source",
      key: "source",
      render: (lead) => <span className="text-sm text-gray-700">{lead.source || "-"}</span>,
    },
    {
      label: "Page URL",
      key: "pageUrl",
      render: (lead) =>
        lead.pageUrl ? (
          <a
            href={lead.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 max-w-[240px] text-xs text-[#b24074] underline underline-offset-4"
          >
            {lead.pageUrl}
          </a>
        ) : (
          "-"
        ),
    },
    {
      label: "Status",
      key: "status",
      render: (lead) => (
        <select
          value={lead.status || "new"}
          disabled={updatingLeadId === lead.id}
          onChange={(event) => updateLeadStatus(lead.id, event.target.value)}
          className={`min-w-[140px] rounded-xl border border-transparent px-3 py-2 text-xs font-semibold capitalize outline-none ${statusClasses[lead.status || "new"] || statusClasses.new}`}
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      label: "Created At",
      key: "createdAt",
      render: (lead) => <span className="text-sm text-gray-600">{formatDate(lead.createdAt)}</span>,
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-400">{filteredLeads.length} visible leads • {leads.length} total</p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ead5de] bg-white px-4 text-sm font-semibold text-[#111111] transition hover:bg-[#fff6fa]"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#ebe5e8] bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by mobile number or URL"
            className="h-10 w-full rounded-xl border border-[#ebe5e8] pl-9 pr-3 text-sm outline-none transition focus:border-[#d15a8f] focus:ring-2 focus:ring-[#f7d7e4]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-xl border border-[#ebe5e8] px-3 text-sm outline-none transition focus:border-[#d15a8f] focus:ring-2 focus:ring-[#f7d7e4]"
        >
          <option value="">All Status</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <select
          value={offerFilter}
          onChange={(event) => setOfferFilter(event.target.value)}
          className="h-10 rounded-xl border border-[#ebe5e8] px-3 text-sm outline-none transition focus:border-[#d15a8f] focus:ring-2 focus:ring-[#f7d7e4]"
        >
          <option value="">All Offers</option>
          {offerOptions.map((offerName) => (
            <option key={offerName} value={offerName}>
              {offerName}
            </option>
          ))}
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={filteredLeads}
        loading={loading}
        emptyText="No leads found"
      />

      {!loading && filteredLeads.length === 0 ? (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Smartphone size={16} />
          No lead records match the current filters.
        </div>
      ) : null}
    </AdminLayout>
  );
};

export default LeadList;
