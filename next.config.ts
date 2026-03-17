import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Required for the production Docker stage (docker/app/Dockerfile)
  output: "standalone",

  experimental: {},

  turbopack: {
    root: __dirname,
  },
}

export default withNextIntl(nextConfig)
