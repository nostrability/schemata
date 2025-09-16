# NIP-18 — Reposts

Status: draft, optional

This NIP defines reposts and quote reposts:

- Repost (kind 6): Signals that a kind-1 text note is worth reading.
  - content: stringified JSON of the reposted note. MAY be empty (not recommended). For NIP-70–protected events, content SHOULD be empty.
  - tags: MUST include an `e` tag with the reposted note id and a relay URL as its third entry. SHOULD include a `p` tag of the reposted author.

- Generic Repost (kind 16): Reposts events other than kind-1.
  - tags: SHOULD contain a `k` tag with the stringified kind of the reposted event.

- Quote Repost: A kind-1 note embedding a `q` tag of the quoted note.
  - `q` tag mirrors NIP-10 `e` tags without the `mark` argument:
    - ["q", <event-id>, <relay-url>?, <pubkey>?]
  - content MUST include the NIP-21 `nevent`, `note`, or `naddr` of the quoted event.

Schemas:

- Event kinds:
  - `nips/nip-18/kind-6/schema.yaml` — Repost (kind 6)
  - `nips/nip-18/kind-16/schema.yaml` — Generic Repost (kind 16)

- Tags:
  - `nips/nip-18/tag/q/schema.yaml` — Quote tag
  - Alias: `@/tag/q.yaml`

Notes:
- The kind-6 schema enforces the presence of an `e` tag with id and relay URL.
- The kind-16 schema enforces the presence of a `k` tag with stringified kind.
- The `q` tag schema allows 2–4 items: id required, relay/pubkey optional.

