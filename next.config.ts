import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /**
       * The ZIP import runs through a Server Action, and those cap the request
       * body at 1MB by default — a real backup exceeded it and the upload died
       * with ERR_CONNECTION_RESET before the action ran, so the UI's advertised
       * 50MB limit was unreachable and the failure was silent.
       *
       * Sized a little above the 50MB the import card offers, to leave room for
       * multipart boundary and header overhead.
       */
      bodySizeLimit: "52mb",
    },
  },
};

export default nextConfig;
