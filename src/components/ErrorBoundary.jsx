import { Component } from "react";

// No error boundary existed anywhere in the app before this — any uncaught
// render-time exception in any route white-screened the whole app with no
// recovery path. This is the minimal, standard fix: catch it, show a plain
// message and a way back, log it for diagnosis. Deliberately undesigned
// (no brand styling) to stay a safety net, not a new UI surface.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#000",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
              Something went wrong loading this page.
            </p>
            <a href="/" style={{ color: "#EDFF00", textDecoration: "underline" }}>
              Back to home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
