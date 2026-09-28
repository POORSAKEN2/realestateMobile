import test from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTs.cjs";
// Native alert/link helpers are outside the payload behavior tested here.
load.cache[load.resolve("react-native")] = {
  exports: { Alert: {}, Linking: {} },
};
const { normalizeAccess } = load("../../utils/auth/accessAdapter.ts");
const { permits } = load("../../utils/auth/accessPolicy.ts");
const { ROUTE_PERMISSIONS } = load("../../utils/auth/routeAccess.ts");
const { describeRequest, assertRequestAccess, ResourceScopeIndex } = load(
  "../../services/access/requestPolicy.ts",
);
const { emptyForm } = load("../../utils/properties/propertyForm.ts");
const { buildPropertyPayload } = load(
  "../../utils/properties/propertyPayload.ts",
);

test("owner management denies managers even with forged mutation grants", () => {
  const manager = normalizeAccess({
    role: "MANAGER",
    assigned_property_ids: ["p1"],
    permissions: [
      "lessors.viewAny",
      "lessors.create",
      "lessors.update",
      "staff.manage",
    ],
  });
  assert.equal(permits(manager, ROUTE_PERMISSIONS["property-owners"]), false);
  assert.equal(permits(manager, "lessors.viewAny"), true);
  for (const [path, method] of [
    ["/lessors", "POST"],
    ["/lessors/owner", "PATCH"],
    ["/lessors/owner/properties", "GET"],
  ]) {
    assert.throws(() =>
      assertRequestAccess(
        manager,
        describeRequest(path, method),
        new ResourceScopeIndex(),
      ),
    );
  }
});

test("new unverified owner is included in an unpublished property payload without changing entered fields", () => {
  const form = {
    ...emptyForm,
    title: "Draft home",
    location: "Manila",
    value: "1234",
    roi: "2",
    lat: "14.5",
    lng: "121",
    ownerId: "new-owner",
  };
  const image = {
    uri: "file:///photo.jpg",
    name: "photo.jpg",
    type: "image/jpeg",
  };
  const result = buildPropertyPayload(form, [image]);
  assert.equal(result.error, undefined);
  assert.equal(result.payload.owner_id, "new-owner");
  assert.equal(result.payload.is_published, false);
  assert.equal(result.payload.title, "Draft home");
  assert.deepEqual(result.payload.images, [image]);
  assert.equal(form.ownerId, "new-owner");
});
