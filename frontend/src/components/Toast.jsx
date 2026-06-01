import { useEffect } from "react";
export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      {type === "success" && "✓ "}{type === "error" && "✕ "}{type === "info" && "· "}
      {message}
    </div>
  );
}
