import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHead({ eyebrow, title, link, linkText }) {
  return <div className="section-head"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{link && <Link to={link} className="subtle-link">{linkText}<ArrowRight size={14}/></Link>}</div>;
}
