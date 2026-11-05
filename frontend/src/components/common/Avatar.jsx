export default function Avatar({ initials = 'VP', size = 'md' }) {
  return <span className={`avatar avatar-${size}`}>{initials}</span>;
}
