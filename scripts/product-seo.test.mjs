import test from "node:test";
import assert from "node:assert/strict";
import { getProductSeoContent } from "../src/data/productSeoContent.js";

test("specific product slugs win over overlapping product names", () => {
  const voice = getProductSeoContent({ productUrl: "voice-face-mask-maker", name: "Ilika Facial Mask Maker Machine" });
  const nonVoice = getProductSeoContent({ productUrl: "non-voice-face-mask-maker", name: "Ilika Facial Mask Maker Machine Non-Voice" });
  assert.notEqual(voice.title, nonVoice.title);
  assert.notEqual(voice.description, nonVoice.description);
  assert.equal(nonVoice.canonicalSlug, "non-voice-face-mask-maker");
});

test("moisturizer sizes have separate metadata", () => {
  const regular = getProductSeoContent({ productUrl: "hydra-gel-moisturizer" });
  const small = getProductSeoContent({ productUrl: "hydra-gel-moisturizer-v2" });
  assert.match(small.title, /25g/);
  assert.notEqual(regular.title, small.title);
  assert.notEqual(regular.description, small.description);
});
