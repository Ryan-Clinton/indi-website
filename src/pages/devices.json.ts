// /devices.json: the list behind the home page device search, built fresh on every build
import { loadDevices } from "../lib/devices";

export async function GET() {
  return new Response(JSON.stringify(await loadDevices()), {
    headers: { "Content-Type": "application/json" },
  });
}
