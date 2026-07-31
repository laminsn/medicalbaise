import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupportedCameraZoomPresets } from './camera.ts';

test('shows only the native view when the browser exposes no zoom or lens evidence', () => {
  assert.deepEqual(
    getSupportedCameraZoomPresets({
      hasVariableZoom: false,
      hasUltraWideLens: false,
      hasTelephotoLens: false,
    }),
    { presets: [1], trackPresets: [1] },
  );
});

test('advertises only presets representable by the active track range and step', () => {
  assert.deepEqual(
    getSupportedCameraZoomPresets({
      min: 1,
      max: 5,
      step: 1,
      hasVariableZoom: true,
      hasUltraWideLens: false,
      hasTelephotoLens: false,
    }),
    { presets: [1, 2, 5], trackPresets: [1, 2, 5] },
  );
});

test('keeps physical-lens presets out of the same-track list', () => {
  assert.deepEqual(
    getSupportedCameraZoomPresets({
      hasVariableZoom: false,
      hasUltraWideLens: true,
      hasTelephotoLens: true,
    }),
    { presets: [0.5, 1, 2], trackPresets: [1] },
  );
});

test('does not advertise a preset that the capability step cannot represent', () => {
  assert.deepEqual(
    getSupportedCameraZoomPresets({
      min: 1,
      max: 5,
      step: 3,
      hasVariableZoom: true,
      hasUltraWideLens: false,
      hasTelephotoLens: false,
    }),
    { presets: [1], trackPresets: [1] },
  );
});

test('does not claim 1x when an exposed variable range starts above 1x', () => {
  assert.deepEqual(
    getSupportedCameraZoomPresets({
      min: 2,
      max: 5,
      step: 1,
      hasVariableZoom: true,
      hasUltraWideLens: false,
      hasTelephotoLens: false,
    }),
    { presets: [2, 5], trackPresets: [2, 5] },
  );
});
