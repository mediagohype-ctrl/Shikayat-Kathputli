export default function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-base font-semibold text-danger">
      ⚠ {message}
    </p>
  );
}
