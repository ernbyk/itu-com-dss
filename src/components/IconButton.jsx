export default function IconButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
