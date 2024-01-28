import App from "./App.svelte";
import "./index.pcss";
import "./splitpanes.pcss";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
