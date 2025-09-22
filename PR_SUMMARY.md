# Add NIP-68 picture event schema

## Summary
- harden base note schemas so each tag entry validates correctly, with clearer messaging and typo fix
- enforce kind constants on the existing NIP-01 kind0/kind1 schemas
- fix numeric/boolean keywords in subscription filter to satisfy Ajv
- add NIP-68 picture event schema requiring title and imeta tags, plus the imeta tag definition/alias

## Testing
- pnpm build
- pnpm test *(fails: `vitest` binary not installed in environment; rerun after `pnpm install`)*
