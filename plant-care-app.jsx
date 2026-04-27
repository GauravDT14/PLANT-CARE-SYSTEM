import { useState, useEffect, useContext, createContext, useCallback } from "react";

const PlantContext = createContext();

const SAMPLE_PLANTS = [
  { id: "1", name: "Monstera Deliciosa", species: "Monstera deliciosa", emoji: "🌿", room: "Living Room", wateringFreq: "weekly", lastWatered: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], sunlight: "indirect", notes: "Loves humidity. Wipe leaves monthly.", healthLog: [{ date: new Date().toISOString().split("T")[0], status: "healthy", note: "Looking lush and green!" }] },
  { id: "2", name: "Peace Lily", species: "Spathiphyllum wallisii", emoji: "🌸", room: "Bedroom", wateringFreq: "weekly", lastWatered: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0], sunlight: "low", notes: "Droops when thirsty — great indicator.", healthLog: [{ date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], status: "needs-attention", note: "Leaves slightly yellow, reduce watering." }] },
  { id: "3", name: "Cactus", species: "Echinopsis pachanoi", emoji: "🌵", room: "Office", wateringFreq: "monthly", lastWatered: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], sunlight: "direct", notes: "Rarely needs water. Full sun.", healthLog: [] },
];

const FREQ_DAYS = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };

function calcNextWater(lastWatered, freq) {
  const last = new Date(lastWatered);
  const days = FREQ_DAYS[freq] || 7;
  const next = new Date(last);
  next.setDate(next.getDate() + days);
  return next;
}

function calcHealth(plant) {
  const next = calcNextWater(plant.lastWatered, plant.wateringFreq);
  const today = new Date();
  const diffDays = Math.floor((next - today) / 86400000);
  if (diffDays < -2) return "critical";
  if (diffDays < 0) return "needs-attention";
  return "healthy";
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(dateStr);
  d.setHours(0,0,0,0);
  return Math.ceil((d - today) / 86400000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const Toast = ({ msg, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#1a3a1a", color: "#c8e6c9", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 16 }}>✓</span> {msg}
    </div>
  );
};

function PlantProvider({ children }) {
  const [plants, setPlants] = useState(() => {
    try { const s = localStorage.getItem("plantcare_plants"); return s ? JSON.parse(s) : SAMPLE_PLANTS; } catch { return SAMPLE_PLANTS; }
  });
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem("plantcare_plants", JSON.stringify(plants)); }, [plants]);

  const showToast = useCallback((msg) => { setToast(msg); }, []);

  const addPlant = (plant) => { setPlants(p => [...p, { ...plant, id: Date.now().toString(), healthLog: [] }]); showToast(`${plant.name} added!`); };
  const updatePlant = (plant) => { setPlants(p => p.map(x => x.id === plant.id ? plant : x)); showToast(`${plant.name} updated!`); };
  const deletePlant = (id) => { setPlants(p => { const pl = p.find(x => x.id === id); showToast(`${pl?.name} removed`); return p.filter(x => x.id !== id); }); };
  const waterPlant = (id) => { setPlants(p => p.map(x => x.id === id ? { ...x, lastWatered: new Date().toISOString().split("T")[0] } : x)); showToast("Watered! 💧"); };
  const addHealthLog = (id, entry) => { setPlants(p => p.map(x => x.id === id ? { ...x, healthLog: [...(x.healthLog || []), entry] } : x)); };

  return (
    <PlantContext.Provider value={{ plants, addPlant, updatePlant, deletePlant, waterPlant, addHealthLog, toast, setToast }}>
      {children}
    </PlantContext.Provider>
  );
}

const HEALTH_CONFIG = {
  healthy: { label: "Healthy", bg: "#e8f5e9", color: "#2e7d32", dot: "#4caf50" },
  "needs-attention": { label: "Needs Attention", bg: "#fff8e1", color: "#f57f17", dot: "#ffc107" },
  critical: { label: "Critical", bg: "#ffebee", color: "#c62828", dot: "#ef5350" },
};

const EMOJIS = ["🌿", "🌸", "🌵", "🌺", "🪴", "🌱", "🌴", "🌾", "🍀", "🌻", "🌹", "🌷"];
const ROOMS = ["Living Room", "Bedroom", "Kitchen", "Office", "Bathroom", "Balcony", "Garden"];

function PlantCard({ plant, onView, onWater }) {
  const health = calcHealth(plant);
  const cfg = HEALTH_CONFIG[health];
  const next = calcNextWater(plant.lastWatered, plant.wateringFreq);
  const daysLeft = daysUntil(next.toISOString().split("T")[0]);
  const overdue = daysLeft < 0;

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e8f0e8", borderRadius: 16, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(30,80,30,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
      onClick={() => onView(plant.id)}>
      <div style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)", padding: "20px 20px 14px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>{plant.emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1b5e20" }}>{plant.name}</div>
        <div style={{ fontSize: 12, color: "#558b2f", fontStyle: "italic" }}>{plant.species}</div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {cfg.label}
          </span>
          <span style={{ fontSize: 11, color: "#78909c" }}>📍 {plant.room}</span>
        </div>
        <div style={{ fontSize: 12, color: overdue ? "#c62828" : "#33691e", background: overdue ? "#ffebee" : "#f9fbe7", borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontWeight: 500 }}>
          {overdue ? `⚠️ Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}` : daysLeft === 0 ? "💧 Water today!" : `💧 Next water in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
        </div>
        <button onClick={e => { e.stopPropagation(); onWater(plant.id); }}
          style={{ width: "100%", padding: "8px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
          onMouseEnter={e => e.target.style.background = "#1b5e20"}
          onMouseLeave={e => e.target.style.background = "#2e7d32"}>
          💧 Mark as Watered
        </button>
      </div>
    </div>
  );
}

function PlantForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", species: "", emoji: "🌿", room: "Living Room", wateringFreq: "weekly", lastWatered: new Date().toISOString().split("T")[0], sunlight: "indirect", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={lbl}>Plant Name *</label>
          <input style={inp} placeholder="e.g. Monstera Deliciosa" value={form.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Species</label>
          <input style={inp} placeholder="Scientific name" value={form.species} onChange={e => set("species", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Emoji / Icon</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0" }}>
            {EMOJIS.map(e => <button key={e} onClick={() => set("emoji", e)} style={{ fontSize: 22, background: form.emoji === e ? "#e8f5e9" : "transparent", border: form.emoji === e ? "2px solid #2e7d32" : "1.5px solid #ddd", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>{e}</button>)}
          </div>
        </div>
        <div>
          <label style={lbl}>Room / Location</label>
          <select style={inp} value={form.room} onChange={e => set("room", e.target.value)}>
            {ROOMS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Watering Frequency</label>
          <select style={inp} value={form.wateringFreq} onChange={e => set("wateringFreq", e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 Weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Last Watered</label>
          <input style={inp} type="date" value={form.lastWatered} onChange={e => set("lastWatered", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Sunlight Requirement</label>
          <select style={inp} value={form.sunlight} onChange={e => set("sunlight", e.target.value)}>
            <option value="direct">Direct Sunlight</option>
            <option value="indirect">Indirect Light</option>
            <option value="low">Low Light</option>
          </select>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={lbl}>Care Notes</label>
          <textarea style={{ ...inp, height: 80, resize: "vertical" }} placeholder="Tips, observations..." value={form.notes} onChange={e => set("notes", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={() => form.name && onSave(form)} style={{ flex: 1, padding: "12px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          {initial ? "💾 Save Changes" : "🌱 Add Plant"}
        </button>
        <button onClick={onCancel} style={{ padding: "12px 20px", background: "#fff", border: "1.5px solid #ddd", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#555" }}>Cancel</button>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#558b2f", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" };
const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #dce8dc", borderRadius: 8, fontSize: 14, color: "#222", background: "#fff", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

function Dashboard({ setPage, setSelectedId }) {
  const { plants, waterPlant } = useContext(PlantContext);
  const [search, setSearch] = useState("");
  const [filterRoom, setFilterRoom] = useState("All");
  const [filterHealth, setFilterHealth] = useState("All");
  const [filterFreq, setFilterFreq] = useState("All");

  const rooms = ["All", ...Array.from(new Set(plants.map(p => p.room)))];
  const filtered = plants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.species.toLowerCase().includes(search.toLowerCase());
    const matchRoom = filterRoom === "All" || p.room === filterRoom;
    const matchHealth = filterHealth === "All" || calcHealth(p) === filterHealth;
    const matchFreq = filterFreq === "All" || p.wateringFreq === filterFreq;
    return matchSearch && matchRoom && matchHealth && matchFreq;
  });

  const totalPlants = plants.length;
  const healthyCount = plants.filter(p => calcHealth(p) === "healthy").length;
  const overdueCount = plants.filter(p => calcHealth(p) !== "healthy").length;
  const waterToday = plants.filter(p => { const n = calcNextWater(p.lastWatered, p.wateringFreq); return daysUntil(n.toISOString().split("T")[0]) <= 0; }).length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total Plants", value: totalPlants, icon: "🪴", bg: "#e8f5e9", color: "#2e7d32" },
          { label: "Healthy", value: healthyCount, icon: "✅", bg: "#f1f8e9", color: "#558b2f" },
          { label: "Need Care", value: overdueCount, icon: "⚠️", bg: "#fff8e1", color: "#f57f17" },
          { label: "Water Today", value: waterToday, icon: "💧", bg: "#e3f2fd", color: "#1565c0" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <input placeholder="🔍 Search plants..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: "9px 14px", border: "1.5px solid #dce8dc", borderRadius: 8, fontSize: 14, outline: "none" }} />
        <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} style={{ padding: "9px 12px", border: "1.5px solid #dce8dc", borderRadius: 8, fontSize: 13, outline: "none" }}>
          {rooms.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterHealth} onChange={e => setFilterHealth(e.target.value)} style={{ padding: "9px 12px", border: "1.5px solid #dce8dc", borderRadius: 8, fontSize: 13, outline: "none" }}>
          <option value="All">All Health</option>
          <option value="healthy">Healthy</option>
          <option value="needs-attention">Needs Attention</option>
          <option value="critical">Critical</option>
        </select>
        <select value={filterFreq} onChange={e => setFilterFreq(e.target.value)} style={{ padding: "9px 12px", border: "1.5px solid #dce8dc", borderRadius: 8, fontSize: 13, outline: "none" }}>
          <option value="All">All Frequencies</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🌱</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#444", marginBottom: 6 }}>No plants found</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>{plants.length === 0 ? "Add your first plant to get started!" : "Try adjusting your filters."}</div>
          {plants.length === 0 && <button onClick={() => setPage("add")} style={{ padding: "10px 24px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>🌿 Add First Plant</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
          {filtered.map(p => <PlantCard key={p.id} plant={p} onView={id => { setSelectedId(id); setPage("detail"); }} onWater={waterPlant} />)}
        </div>
      )}
    </div>
  );
}

function AddEditPage({ editPlant, onSave, onCancel }) {
  const { addPlant, updatePlant } = useContext(PlantContext);
  const handle = (form) => {
    if (editPlant) updatePlant({ ...editPlant, ...form });
    else addPlant(form);
    onSave();
  };
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1b5e20", marginBottom: 24 }}>
        {editPlant ? "✏️ Edit Plant" : "🌱 Add New Plant"}
      </h2>
      <PlantForm initial={editPlant} onSave={handle} onCancel={onCancel} />
    </div>
  );
}

function DetailPage({ plantId, onBack, onEdit }) {
  const { plants, waterPlant, deletePlant, addHealthLog } = useContext(PlantContext);
  const plant = plants.find(p => p.id === plantId);
  const [logForm, setLogForm] = useState({ status: "healthy", note: "" });
  const [showLog, setShowLog] = useState(false);

  if (!plant) return <div style={{ textAlign: "center", padding: 40 }}>Plant not found. <button onClick={onBack} style={{ color: "#2e7d32", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Go back</button></div>;

  const health = calcHealth(plant);
  const cfg = HEALTH_CONFIG[health];
  const next = calcNextWater(plant.lastWatered, plant.wateringFreq);
  const daysLeft = daysUntil(next.toISOString().split("T")[0]);
  const sunlightMap = { direct: "☀️ Direct Sunlight", indirect: "🌤 Indirect Light", low: "🌑 Low Light" };

  const submitLog = () => {
    if (!logForm.note.trim()) return;
    addHealthLog(plant.id, { date: new Date().toISOString().split("T")[0], ...logForm });
    setLogForm({ status: "healthy", note: "" });
    setShowLog(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)", borderRadius: 20, padding: "28px 28px 20px", marginBottom: 20, border: "1.5px solid #c8e6c9" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ fontSize: 72 }}>{plant.emoji}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1b5e20", margin: "0 0 4px" }}>{plant.name}</h2>
            <p style={{ fontSize: 14, color: "#558b2f", fontStyle: "italic", margin: "0 0 10px" }}>{plant.species}</p>
            <span style={{ fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color, padding: "4px 12px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />{cfg.label}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => onEdit(plant)} style={{ padding: "8px 16px", background: "#fff", border: "1.5px solid #2e7d32", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#2e7d32", cursor: "pointer" }}>✏️ Edit</button>
            <button onClick={() => { deletePlant(plant.id); onBack(); }} style={{ padding: "8px 16px", background: "#fff", border: "1.5px solid #e53935", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#e53935", cursor: "pointer" }}>🗑 Delete</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "📍", label: "Location", val: plant.room },
          { icon: "💧", label: "Frequency", val: plant.wateringFreq.charAt(0).toUpperCase() + plant.wateringFreq.slice(1) },
          { icon: "📅", label: "Last Watered", val: formatDate(plant.lastWatered) },
          { icon: "🗓", label: "Next Water", val: formatDate(next.toISOString().split("T")[0]) },
          { icon: "🌞", label: "Sunlight", val: sunlightMap[plant.sunlight] },
          { icon: "📝", label: "Notes", val: plant.notes || "—" },
        ].map(item => (
          <div key={item.label} style={{ background: "#f9fbe7", borderRadius: 12, padding: "12px 16px", border: "1.5px solid #e8f0e8" }}>
            <div style={{ fontSize: 11, color: "#78909c", fontWeight: 600, marginBottom: 3 }}>{item.icon} {item.label}</div>
            <div style={{ fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: daysLeft < 0 ? "#ffebee" : "#e8f5e9", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: `1.5px solid ${daysLeft < 0 ? "#ffcdd2" : "#c8e6c9"}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: daysLeft < 0 ? "#c62828" : "#2e7d32" }}>
            {daysLeft < 0 ? `⚠️ Overdue by ${Math.abs(daysLeft)} day(s)` : daysLeft === 0 ? "💧 Water today!" : `💧 Water in ${daysLeft} day(s)`}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Next scheduled: {formatDate(next.toISOString().split("T")[0])}</div>
        </div>
        <button onClick={() => waterPlant(plant.id)} style={{ padding: "10px 22px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>💧 Water Now</button>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1.5px solid #e8f0e8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1b5e20", margin: 0 }}>📋 Health Log</h3>
          <button onClick={() => setShowLog(!showLog)} style={{ padding: "7px 14px", background: "#e8f5e9", border: "1.5px solid #a5d6a7", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#2e7d32", cursor: "pointer" }}>+ Add Entry</button>
        </div>

        {showLog && (
          <div style={{ background: "#f9fbe7", borderRadius: 12, padding: 16, marginBottom: 16, border: "1.5px solid #dce8dc" }}>
            <select value={logForm.status} onChange={e => setLogForm(f => ({ ...f, status: e.target.value }))} style={{ ...inp, marginBottom: 10 }}>
              <option value="healthy">Healthy</option>
              <option value="needs-attention">Needs Attention</option>
              <option value="critical">Critical</option>
            </select>
            <textarea value={logForm.note} onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))} placeholder="Write your observation..." style={{ ...inp, height: 70, marginBottom: 10, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={submitLog} style={{ flex: 1, padding: "9px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Entry</button>
              <button onClick={() => setShowLog(false)} style={{ padding: "9px 16px", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {(plant.healthLog || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#aaa", fontSize: 13 }}>No health entries yet. Add the first one!</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...(plant.healthLog || [])].reverse().map((entry, i) => {
              const ec = HEALTH_CONFIG[entry.status];
              return (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ec.dot, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, background: ec.bg, borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: ec.color }}>{ec.label}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{formatDate(entry.date)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#333" }}>{entry.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SchedulePage() {
  const { plants } = useContext(PlantContext);
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1b5e20", marginBottom: 8 }}>🗓 7-Day Care Schedule</h3>
        <div style={{ fontSize: 13, color: "#666" }}>Overview of all upcoming plant care tasks for the next 7 days.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map((day, i) => {
          const isToday = i === 0;
          const duePlants = plants.filter(p => {
            const next = calcNextWater(p.lastWatered, p.wateringFreq);
            const dayStr = day.toISOString().split("T")[0];
            const nextStr = next.toISOString().split("T")[0];
            return nextStr <= dayStr && nextStr >= today.toISOString().split("T")[0];
          });
          const overduePlants = plants.filter(p => {
            const next = calcNextWater(p.lastWatered, p.wateringFreq);
            return i === 0 && next < today;
          });
          const allDue = i === 0 ? [...overduePlants.filter(p => !duePlants.includes(p)), ...duePlants] : duePlants;

          return (
            <div key={i} style={{ background: isToday ? "#e8f5e9" : "#fff", border: `1.5px solid ${isToday ? "#a5d6a7" : "#e8f0e8"}`, borderRadius: 12, padding: "10px 8px", minHeight: 120 }}>
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? "#2e7d32" : "#888" }}>{dayNames[day.getDay()]}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? "#1b5e20" : "#333" }}>{day.getDate()}</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>{months[day.getMonth()]}</div>
              </div>
              {allDue.length === 0 ? (
                <div style={{ fontSize: 10, color: "#ccc", textAlign: "center" }}>—</div>
              ) : allDue.map(p => (
                <div key={p.id} title={p.name} style={{ background: "#fff", border: "1px solid #c8e6c9", borderRadius: 6, padding: "4px 6px", marginBottom: 4, fontSize: 10, fontWeight: 600, color: "#2e7d32", display: "flex", alignItems: "center", gap: 3, overflow: "hidden" }}>
                  <span>{p.emoji}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1b5e20", marginBottom: 14 }}>📋 All Plants Schedule</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {plants.map(p => {
            const next = calcNextWater(p.lastWatered, p.wateringFreq);
            const daysLeft = daysUntil(next.toISOString().split("T")[0]);
            const health = calcHealth(p);
            const cfg = HEALTH_CONFIG[health];
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #e8f0e8" }}>
                <span style={{ fontSize: 28 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#1b5e20", fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{p.room} · {p.wateringFreq}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: 20, marginBottom: 4 }}>{cfg.label}</div>
                  <div style={{ fontSize: 11, color: daysLeft < 0 ? "#c62828" : daysLeft === 0 ? "#2e7d32" : "#666", fontWeight: 600 }}>
                    {daysLeft < 0 ? `Overdue ${Math.abs(daysLeft)}d` : daysLeft === 0 ? "💧 Today!" : `in ${daysLeft}d`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [editPlant, setEditPlant] = useState(null);
  const { toast, setToast } = useContext(PlantContext);

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "add", icon: "➕", label: "Add Plant" },
    { id: "schedule", icon: "📅", label: "Schedule" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f6faf6", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1.5px solid #e8f0e8", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>🌿</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1b5e20", lineHeight: 1.2 }}>PlantCare</div>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.5px" }}>MANAGEMENT SYSTEM</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setEditPlant(null); }}
                style={{ padding: "7px 14px", background: page === n.id ? "#e8f5e9" : "transparent", border: page === n.id ? "1.5px solid #a5d6a7" : "1.5px solid transparent", borderRadius: 8, fontSize: 13, fontWeight: 600, color: page === n.id ? "#2e7d32" : "#666", cursor: "pointer", transition: "all 0.15s" }}>
                {n.icon} {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        {page !== "dashboard" && page !== "schedule" && page !== "add" && (
          <button onClick={() => { setPage("dashboard"); setEditPlant(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#2e7d32", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16, padding: 0 }}>
            ← Back to Dashboard
          </button>
        )}

        {page === "dashboard" && <Dashboard setPage={setPage} setSelectedId={setSelectedId} />}
        {page === "add" && <AddEditPage editPlant={editPlant} onSave={() => { setPage("dashboard"); setEditPlant(null); }} onCancel={() => { setPage("dashboard"); setEditPlant(null); }} />}
        {page === "detail" && <DetailPage plantId={selectedId} onBack={() => setPage("dashboard")} onEdit={p => { setEditPlant(p); setPage("add"); }} />}
        {page === "schedule" && <SchedulePage />}
      </main>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function Root() {
  return <PlantProvider><App /></PlantProvider>;
}
