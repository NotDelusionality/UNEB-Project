export function FieldError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className="text-[13px] text-destructive" role="alert">
      {message}
    </p>
  );
}
