export default function PageHead({ eyebrow, title, sub, action, children }) {
  return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{sub}</p>{children}</div>{action}</div>;
}
