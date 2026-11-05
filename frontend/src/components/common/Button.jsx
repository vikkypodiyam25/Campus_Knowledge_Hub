export default function Button({ children, kind = 'primary', ...props }) {
  return <button className={`btn btn-${kind}`} {...props}>{children}</button>;
}
