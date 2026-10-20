import { serializeJsonLd } from "../../lib/seo";

/** One JSON-LD block (builders in lib/seo.js). Google reads it anywhere in the rendered DOM. */
function JsonLd({ data }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export default JsonLd;
