import type { Connect, Plugin } from "vite";
import type { ResolvedConfig } from "vite";
import { loadBaseAccount, readAddress } from "./server/baseAccount";
import { loadScanFeedback } from "./server/scanFeedback";

function attach(middlewares: Connect.Server, config: ResolvedConfig) {
  middlewares.use("/api/base-account", (req, res) => {
    const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const address = readAddress(new URLSearchParams(query).get("address"));
    if (!address) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Invalid address" }));
      return;
    }
    loadBaseAccount(address)
      .then((body) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(body));
      })
      .catch((error: unknown) => {
        res.statusCode = 502;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Base request failed" }));
      });
  });

  middlewares.use("/api/erc8004-feedback", (req, res) => {
    const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const agentId = Number(new URLSearchParams(query).get("agentId"));
    if (!Number.isInteger(agentId) || agentId < 0) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Invalid agent id" }));
      return;
    }
    loadScanFeedback(agentId)
      .then((notes) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ notes }));
      })
      .catch((error: unknown) => {
        res.statusCode = 502;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "8004scan request failed" }));
      });
  });
}

export function baseAccountApi(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "base-account-api",
    configResolved(resolved) {
      config = resolved;
    },
    configureServer(server) {
      attach(server.middlewares, config);
    },
    configurePreviewServer(server) {
      attach(server.middlewares, config);
    },
  };
}
