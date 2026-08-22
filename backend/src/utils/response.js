// Shared response envelope: { data, error, meta }
function ok(res, data, meta = {}) {
  return res.json({ data, error: null, meta });
}

function created(res, data, meta = {}) {
  return res.status(201).json({ data, error: null, meta });
}

module.exports = { ok, created };
