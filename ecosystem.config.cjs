module.exports = {
  apps: [
    {
      name: "ac-online",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};