/**
 * Cloudflare Pages middleware — Google Tag Manager container (GTM-T9NBZTF7).
 *
 * Runs on every request. For HTML responses only, it injects the two GTM
 * snippets at Google's recommended positions, using HTMLRewriter:
 *   - the GTM <script> is appended as the last child of <head>
 *     (i.e. immediately before </head>);
 *   - the GTM <noscript> is prepended as the first child of <body>
 *     (i.e. immediately after the opening <body> tag).
 *
 * Everything else (API JSON, CSS, JS, images, etc.) passes through untouched.
 * The transform is wrapped so that any failure falls back to the original
 * response — a fault here can never break page delivery. Because injection
 * happens once per response at a single choke point, exactly one GTM instance
 * loads per page. Existing Microsoft Clarity (in main.js) and the Google
 * Search Console meta tag are left completely untouched.
 */

const GTM_ID = "GTM-T9NBZTF7";

const GTM_HEAD =
  "<!-- Google Tag Manager -->\n" +
  "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n" +
  "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n" +
  "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n" +
  "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n" +
  "})(window,document,'script','dataLayer','" + GTM_ID + "');</script>\n" +
  "<!-- End Google Tag Manager -->";

const GTM_BODY =
  "<!-- Google Tag Manager (noscript) -->\n" +
  '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' + GTM_ID + '"\n' +
  'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n' +
  "<!-- End Google Tag Manager (noscript) -->\n";

export async function onRequest(context) {
  const response = await context.next();

  try {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return response;

    return new HTMLRewriter()
      .on("head", {
        element(el) { el.append(GTM_HEAD, { html: true }); }
      })
      .on("body", {
        element(el) { el.prepend(GTM_BODY, { html: true }); }
      })
      .transform(response);
  } catch (err) {
    // Never let tag injection break the page — serve the original response.
    return response;
  }
}
