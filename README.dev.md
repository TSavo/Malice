# Development Environment

## Quick Start

```bash
# Start dev environment with live reload
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f game

# Stop dev environment
docker compose -f docker-compose.dev.yml down
```

## Features

- **Live Reload**: Source files are mounted from your local filesystem. Changes to `src/`, `types/`, or `tsconfig.json` trigger automatic restarts via `tsx watch`.
- **No Rebuild Required**: Changes are reflected immediately without rebuilding Docker images.
- **Persistent Database**: MongoDB data is stored in a Docker volume, so your data persists between restarts.
- **Development Database**: Uses `malice_dev` database instead of `malice`.

## File Watching

The dev environment uses `tsx watch` which automatically restarts the server when files change:
- `src/**/*.ts` - All TypeScript source files
- `types/**/*.ts` - Type definition files
- `tsconfig.json` - TypeScript configuration

## Differences from Production

| Feature | Development | Production |
|---------|-------------|------------|
| Source Files | Mounted live from host | Copied into image |
| Reload | Automatic via tsx watch | Manual restart required |
| Database | malice_dev | malice |
| Container | malice-game-dev | malice-game |
| Build | Not required | Required on code changes |

## Debugging

Access the running container:
```bash
docker compose -f docker-compose.dev.yml exec game sh
```

Check MongoDB directly:
```bash
docker compose -f docker-compose.dev.yml exec mongodb mongosh malice_dev
```

Drop database for fresh start:
```bash
docker compose -f docker-compose.dev.yml exec mongodb mongosh malice_dev --eval "db.dropDatabase()"
docker compose -f docker-compose.dev.yml restart game
```

## First User Admin

When you create a fresh database, the **first user to complete character creation automatically becomes an administrator**:

- `isWizard: true` - Full wizard/admin privileges
- `canUseDevTools: true` - Access to development tools
- `title: 'the Administrator'` - Special title

This ensures you can bootstrap your world with admin access. Subsequent users are created as regular players with `isWizard: false`.

To test this:
```bash
# Drop database for fresh start
docker compose -f docker-compose.dev.yml exec mongodb mongosh malice_dev --eval "db.dropDatabase()"
docker compose -f docker-compose.dev.yml restart game

# Connect via telnet and create first user
telnet localhost 4000
```

## Tips

- **WSL2 Performance**: If on Windows with WSL2, file watching may be slower. Consider running Docker directly in WSL2 for better performance.
- **node_modules**: Stored in a named volume to avoid conflicts between host and container Node versions.
- **Read-only Mounts**: Source files are mounted read-only (`:ro`) for safety. Build artifacts stay in the container.
