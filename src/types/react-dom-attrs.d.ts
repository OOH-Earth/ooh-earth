// Real HTML5 iframe attribute (Payment Request API) used by the Donorbox
// embed in Support.jsx — @types/react's IframeHTMLAttributes doesn't
// declare it. See the matching react/no-unknown-property ESLint ignore
// entry in eslint.config.js for the same gap on the lint side.
import "react";

declare module "react" {
  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    allowpaymentrequest?: boolean;
  }
}
