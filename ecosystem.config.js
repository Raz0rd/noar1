module.exports = {
  apps: [
    {
      name: 'gasbutano',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/gasbutano',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
}
