import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFieldMission,
  geodesicDistanceMeters,
  missionProgress,
  missionItemProgress,
  MISSION_PROGRESS,
  orderMissionItems,
  updateMissionProgress,
  validMissionCoordinate,
} from './fieldMission.js';

const item = (id, lat, lng, priority = 'HIGH') => ({
  id,
  lat,
  lng,
  priority,
  reasons: [`reason-${id}`],
  next_action: 'VERIFY IN FIELD',
});

test('mission is bounded, deduplicated, and preserves priority/reasons', () => {
  const mission = createFieldMission([item('a', 1, 1), item('a', 1, 1), item('b', 2, 2)], {
    cap: 1,
  });
  assert.equal(mission.items.length, 1);
  assert.deepEqual(mission.items[0].reasons, ['reason-a']);
  assert.equal(mission.items[0].priority, 'HIGH');
});

test('explicit reference produces deterministic nearest-next geodesic ordering', () => {
  const mission = createFieldMission([item('far', 2, 2), item('near', 1.01, 1.01)], {
    reference: { lat: 1, lng: 1 },
  });
  assert.deepEqual(
    mission.items.map((x) => x.id),
    ['near', 'far'],
  );
  assert.equal(mission.ordering, 'NEAREST NEXT BY STRAIGHT-LINE DISTANCE');
  assert.ok(mission.items[0].distance_m > 0);
});

test('invalid or missing coordinates never produce a distance or route claim', () => {
  assert.equal(validMissionCoordinate({ lat: 91, lng: 0 }), false);
  assert.equal(geodesicDistanceMeters({ lat: 1, lng: 1 }, { lat: 'bad', lng: 2 }), null);
  assert.equal(orderMissionItems([item('x', 'bad', 2)], { lat: 1, lng: 1 })[0].distance_m, null);
});

test('progress is session-controlled and never inferred from opening a location', () => {
  assert.equal(missionProgress('opened'), MISSION_PROGRESS.NOT_STARTED);
  assert.equal(missionProgress(MISSION_PROGRESS.COMPLETED), MISSION_PROGRESS.COMPLETED);
});

test('progress survives mission navigation and selects the next actionable item', () => {
  const mission = createFieldMission([item('a', 1, 1), item('b', 2, 2)]);
  const updated = updateMissionProgress(mission, 'a', MISSION_PROGRESS.COMPLETED);
  assert.equal(missionItemProgress(updated, 'a'), MISSION_PROGRESS.COMPLETED);
  assert.equal(missionItemProgress(updated, 'b'), MISSION_PROGRESS.NOT_STARTED);
  assert.deepEqual(createFieldMission(updated.items, { progress: updated.progress }).progress, {
    a: MISSION_PROGRESS.COMPLETED,
  });
});

test('invalid progress updates cannot create stale mission items', () => {
  const mission = createFieldMission([item('a', 1, 1)]);
  assert.equal(updateMissionProgress(mission, 'missing', MISSION_PROGRESS.COMPLETED), mission);
  assert.equal(missionItemProgress(mission, 'a'), MISSION_PROGRESS.NOT_STARTED);
});
