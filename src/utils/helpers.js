const aliasMap = {
  "BITCOIN": "BTC",
  "ETHEREUM": "ETH",
  "SOLANA": "SOL",
  "TETHER": "USDT"
};

exports.normalize = (tx) => {
  let asset = tx.asset?.trim().toUpperCase();
  if (aliasMap[asset]) {
    asset = aliasMap[asset];
  }

  return {
    ...tx,
    asset: asset,
    type: mapType(tx.type),
    quantity: parseFloat(tx.quantity),
    timestamp: new Date(tx.timestamp)
  };
};

function mapType(type) {
  if (!type) return "";
  if (type === "TRANSFER_IN" || type === "TRANSFER_OUT") {
    return "TRANSFER";
  }
  return type.toUpperCase();
}

exports.isMatch = (u, e, config) => {
  const timeDiff = Math.abs(u.timestamp - e.timestamp) / 1000;
  const qtyDiffPct = Math.abs(u.quantity - e.quantity) / e.quantity * 100;
  
  return (
    u.asset === e.asset &&
    u.type === e.type &&
    timeDiff <= config.time &&
    qtyDiffPct <= config.qty
  );
};
