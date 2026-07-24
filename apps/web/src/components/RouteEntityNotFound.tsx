interface RouteEntityNotFoundProps {
  title: string;
  message: string;
  fallbackHref: string;
  fallbackLabel: string;
}

export const RouteEntityNotFound = ({
  title,
  message,
  fallbackHref,
  fallbackLabel,
}: RouteEntityNotFoundProps) => {
  return (
    <section className="panel">
      <h1>{title}</h1>
      <p>{message}</p>
      <a href={fallbackHref}>{fallbackLabel}</a>
    </section>
  );
};
