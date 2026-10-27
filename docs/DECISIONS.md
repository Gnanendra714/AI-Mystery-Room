# Decisions

- Local development without MongoDB or Gemini uses a deterministic, fictional fixture and in-memory storage. This makes setup and the end-to-end game loop usable without external credentials. Configured environments use MongoDB and Gemini; production startup requires MongoDB.
- MongoDB stores a case solution separately from public case fields. In-memory fixture IDs use the same public DTO shape.
- With no accounts, the one-attempt policy is enforced per case ID in the current server process, as the specification cautions that anonymous cross-browser identity cannot be guaranteed.
- No media provider is configured. Image and camera evidence use textual, explicitly fictional representations.
- Retention remains manual until a product retention and deletion policy is approved.
