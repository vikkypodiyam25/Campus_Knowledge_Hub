export default function Stat({ icon: Icon, label, value, change, color }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={18}/></div><span className="stat-change">{change}</span><strong>{value}</strong><span className="stat-label">{label}</span></div>;
}
