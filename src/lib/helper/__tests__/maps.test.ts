import { describe, expect, it } from 'vitest';
import {
  distanceKm,
  isGoogleMapsLink,
  isShortMapsLink,
  mapsSearchUrl,
  parseLatLng,
  parseMapsLink,
  stopMapUrl,
} from '../maps';

describe('parseMapsLink', () => {
  it("prefers a place link's pin over the map centre", () => {
    const link =
      'https://www.google.com/maps/place/H%E1%BB%93+Xu%C3%A2n+H%C6%B0%C6%A1ng/@11.9420,108.4300,15z/data=!4m6!3m5!1s0x0:0x0!8m2!3d11.9416!4d108.4446!16s';
    expect(parseMapsLink(link)).toEqual({
      point: { lat: 11.9416, lng: 108.4446 },
      name: 'Hồ Xuân Hương',
    });
  });

  it('reads the map centre and query coordinates', () => {
    expect(parseMapsLink('https://www.google.com/maps/@10.7769,106.7009,17z').point).toEqual({
      lat: 10.7769,
      lng: 106.7009,
    });
    expect(parseMapsLink('https://maps.google.com/?q=16.0544,108.2022').point).toEqual({
      lat: 16.0544,
      lng: 108.2022,
    });
  });

  it('takes typed coordinates and rejects nonsense', () => {
    expect(parseLatLng(' 11.94, 108.44 ')).toEqual({ lat: 11.94, lng: 108.44 });
    expect(parseLatLng('95, 10')).toBeUndefined();
    expect(parseMapsLink('Chợ Đà Lạt')).toEqual({});
    expect(parseMapsLink('https://maps.app.goo.gl/AbC123')).toEqual({});
  });
});

it('tells Google Maps links and short share links apart', () => {
  expect(isShortMapsLink('https://maps.app.goo.gl/AbC123')).toBe(true);
  expect(isGoogleMapsLink('https://maps.app.goo.gl/AbC123')).toBe(true);
  expect(isGoogleMapsLink('https://www.google.com.vn/maps/place/x')).toBe(true);
  expect(isGoogleMapsLink('https://maps.google.com/?q=x')).toBe(true);
  expect(isGoogleMapsLink('https://evil.example/maps/place/x')).toBe(false);
  expect(isGoogleMapsLink('https://www.google.com/search?q=x')).toBe(false);
  expect(isShortMapsLink('https://goo.gl/other')).toBe(false);
});

it('opens the pasted link, else searches the place', () => {
  expect(stopMapUrl({ mapUrl: 'https://maps.app.goo.gl/x', place: 'A' })).toBe(
    'https://maps.app.goo.gl/x',
  );
  expect(stopMapUrl({ place: ' Hồ Xuân Hương ' })).toBe(mapsSearchUrl('Hồ Xuân Hương'));
  expect(mapsSearchUrl(' Hồ Xuân Hương ')).toBe(
    'https://www.google.com/maps/search/?api=1&query=H%E1%BB%93%20Xu%C3%A2n%20H%C6%B0%C6%A1ng',
  );
  expect(stopMapUrl({})).toBeNull();
});

it('measures straight-line distance', () => {
  // Ho Chi Minh City → Da Lat is about 220 km as the crow flies.
  const km = distanceKm({ lat: 10.7769, lng: 106.7009 }, { lat: 11.9404, lng: 108.4583 });
  expect(km).toBeGreaterThan(210);
  expect(km).toBeLessThan(235);
});
