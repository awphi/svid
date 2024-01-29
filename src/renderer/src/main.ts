import App from "./App.svelte";
import "./index.css";
import "./splitpanes.css";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
