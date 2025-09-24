// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Initialize theme before any React components load
import './shared/utils/theme-init.js';

// Initialize topbar for loading indication
import topbar from 'topbar';

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import 'phoenix_html';
// Establish Phoenix Socket and LiveView configuration.
import { Socket } from 'phoenix';
import { LiveSocket } from 'phoenix_live_view';

// Import the AI Flow Builder app
import './apps/ai-flow';
// Import the Home app
import './apps/home';
// Import the Auth app
import './apps/auth';

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute('content');

// Function to get auth token for WebSocket
function getSocketParams() {
  const token = localStorage.getItem('helix_auth_token');
  return {
    _csrf_token: csrfToken,
    ...(token && { token }),
  };
}

// Configure topbar
topbar.config({
  barColors: { 0: '#98c379', 0.5: '#7fb069', 1.0: '#5a9b4d' }, // Green gradient
  shadowColor: 'rgba(0, 0, 0, .5)',
  barThickness: 4,
  className: 'topbar',
});

let liveSocket = new LiveSocket('/live', Socket, {
  longPollFallbackMs: 2500,
  params: getSocketParams,
});

// Show loading bar on page transitions
window.addEventListener('phx:page-loading-start', () => topbar.show());
window.addEventListener('phx:page-loading-stop', () => topbar.hide());

// Also show on regular navigation events
window.addEventListener('beforeunload', () => topbar.show());
window.addEventListener('load', () => topbar.hide());

// Expose topbar globally for manual control in React apps
window.topbar = topbar;

// connect if there are any LiveViews on the page
liveSocket.connect();

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket;
