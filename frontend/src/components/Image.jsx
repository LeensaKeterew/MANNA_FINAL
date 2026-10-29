// Thin wrapper around the post <img> tag so every place that renders a post
// image goes through one component. Renders exactly the same markup as before.
export default function Image({ src, alt, className, ...rest }) {
  return <img src={src} alt={alt} className={className} {...rest} />;
}
