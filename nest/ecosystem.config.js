module.exports = {
  apps: [{
    name: 'control-acceso',
    script: './dist/main.js',
    cwd: '/opt/apps/control-acceso/nest',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
    },
    error_file: '/var/log/control-acceso/error.log',
    out_file: '/var/log/control-acceso/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    kill_timeout: 5000,
    listen_timeout: 8000,
    autorestart: true,
  }],
};
