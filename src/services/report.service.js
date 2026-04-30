const Report = require('../models/Report.model');

exports.save = async (data) => {
  const report = new Report({ data });
  await report.save();
  return report._id.toString();
};

exports.get = async (id) => {
  try {
    const report = await Report.findById(id);
    return report ? report.data : [];
  } catch (e) {
    return [];
  }
};

exports.summary = async (id) => {
  const data = await exports.get(id);
  return {
    matched: data.filter(x => x.status === "MATCHED").length,
    conflicting: data.filter(x => x.status === "CONFLICTING").length,
    unmatchedUser: data.filter(x => x.status === "UNMATCHED_USER").length,
    unmatchedExchange: data.filter(x => x.status === "UNMATCHED_EXCHANGE").length
  };
};

exports.unmatched = async (id) => {
  const data = await exports.get(id);
  return data.filter(x => x.status.startsWith("UNMATCHED"));
};

exports.generateCSV = async (id) => {
  const data = await exports.get(id);
  if (data.length === 0) return "";

  const headers = [
    "Status", "Reason", 
    "User_ID", "User_Time", "User_Type", "User_Asset", "User_Qty",
    "Exch_ID", "Exch_Time", "Exch_Type", "Exch_Asset", "Exch_Qty"
  ];

  const rows = data.map(item => {
    const u = item.user || {};
    const e = item.exchange || {};
    const values = [
      item.status,
      item.reason,
      u.transaction_id || u.id || "", u.timestamp || "", u.type || "", u.asset || "", u.quantity || "",
      e.transaction_id || e.id || "", e.timestamp || "", e.type || "", e.asset || "", e.quantity || ""
    ];
    // Basic CSV escaping: wrap in quotes and escape internal quotes
    return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  return [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
};
