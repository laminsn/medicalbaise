import {
  createConfirmationToken,
  minimumNecessaryCopy,
  normalizeReminderOffsets,
  verifyConfirmationToken,
} from "./medical-appointment-lifecycle.ts";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

Deno.test("confirmation tokens verify and preserve the allowed action", async () => {
  const now = Math.floor(Date.now() / 1000);
  const secret = "test-secret-that-is-at-least-thirty-two-bytes";
  const token = await createConfirmationToken(
    {
      eventId: "c1b8773c-421f-4b11-88e8-08ea3283529d",
      action: "confirm",
      expiresAt: now + 300,
    },
    secret,
  );

  const payload = await verifyConfirmationToken(token, secret, now);
  assert(payload?.action === "confirm", "expected confirmation action");
  assert(
    payload?.eventId === "c1b8773c-421f-4b11-88e8-08ea3283529d",
    "expected opaque event identifier",
  );
});

Deno.test("confirmation tokens reject tampering, expiry, and wrong secrets", async () => {
  const now = Math.floor(Date.now() / 1000);
  const secret = "test-secret-that-is-at-least-thirty-two-bytes";
  const token = await createConfirmationToken(
    {
      eventId: "02fc1080-15f0-43ad-b42c-df0558114eaf",
      action: "decline",
      expiresAt: now + 60,
    },
    secret,
  );

  assert(
    await verifyConfirmationToken(`${token}x`, secret, now) === null,
    "tampered token must fail",
  );
  assert(
    await verifyConfirmationToken(token, "another-secret-that-is-at-least-thirty-two", now) === null,
    "wrong secret must fail",
  );
  assert(
    await verifyConfirmationToken(token, secret, now + 61) === null,
    "expired token must fail",
  );
});

Deno.test("reminder offsets are bounded, unique, and sorted", () => {
  const normalized = normalizeReminderOffsets([60, 1440, 60, -1, 10081, 15]);
  assert(
    JSON.stringify(normalized) === JSON.stringify([1440, 60, 15]),
    "expected bounded unique reminder offsets",
  );
});

Deno.test("review copy is neutral and contains no appointment detail fields", () => {
  const result = minimumNecessaryCopy("review_request", "en");
  assert(result.isMarketing, "review request must be classified as marketing");
  assert(result.body.includes("If you choose"), "review must be optional");
  assert(!result.body.includes("reward"), "review must not promise a reward");
  assert(!result.body.includes("credit"), "review must not promise credit");
});

Deno.test("transactional copy remains generic", () => {
  const result = minimumNecessaryCopy("reminder", "en");
  assert(!result.isMarketing, "reminder must remain transactional");
  assert(!result.body.includes("{{"), "copy must not require PHI substitutions");
  assert(!result.body.toLowerCase().includes("diagnosis"), "copy must not expose diagnosis");
});
