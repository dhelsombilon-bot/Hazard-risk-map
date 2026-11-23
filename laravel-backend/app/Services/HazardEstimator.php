<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * GeoPermit hazard ESTIMATE for any point — the same method used for the seeded buildings
 * (see database/seeders/BuildingSeeder.php). Used only when no official hazard map is loaded.
 *
 *   Flood:     High              elev <= 6 m and (coast <= 300 m or river <= 150 m)
 *              Moderate-to-High  elev <= 10 m and (coast <= 600 m or river <= 300 m)
 *              Moderate          elev <= 15 m or river <= 500 m
 *              Low               otherwise
 *   Landslide: max slope to points 150 m N/S/E/W — >=30% High, >=20% Mod-to-High, >=10% Moderate, else Low
 *
 * Elevation: SRTM 30 m via OpenTopoData (cached). Coast/rivers: resources/geo/bongabong-water.json
 * (OpenStreetMap, downloaded once). Returns null when elevation can't be fetched — never guesses.
 */
class HazardEstimator
{
    public const DATASET = 'GeoPermit estimate (SRTM 30m + OSM water features)';
    public const SOURCE = 'SRTM 30 m (OpenTopoData) + OpenStreetMap';
    public const NOTES = 'Estimated from elevation, slope and distance to coast/rivers. Not an official hazard map.';

    private const SLOPE_STEP_M = 150;

    private static ?array $water = null;

    /** @return array{Flood:string,Landslide:string,inputs:array}|null */
    public function estimate(float $lat, float $lng): ?array
    {
        $elev = $this->elevations($lat, $lng);
        if ($elev === null) {
            return null;
        }
        [$e0, $around] = $elev;
        $slope = max(array_map(fn($e) => abs($e - $e0) / self::SLOPE_STEP_M * 100, $around));

        [$coast] = $this->nearest($lat, $lng, 'coastline');
        [$river, $riverName] = $this->nearest($lat, $lng, 'river');

        $flood = match (true) {
            $e0 <= 6 && ($coast <= 300 || $river <= 150) => 'High',
            $e0 <= 10 && ($coast <= 600 || $river <= 300) => 'Moderate-to-High',
            $e0 <= 15 || $river <= 500 => 'Moderate',
            default => 'Low',
        };
        $landslide = match (true) {
            $slope >= 30 => 'High',
            $slope >= 20 => 'Moderate-to-High',
            $slope >= 10 => 'Moderate',
            default => 'Low',
        };

        return [
            'Flood' => $flood,
            'Landslide' => $landslide,
            'inputs' => [
                'elevation_m' => $e0,
                'max_slope_pct' => round($slope, 1),
                'coast_distance_m' => is_finite($coast) ? (int) round($coast) : null,
                'river_distance_m' => is_finite($river) ? (int) round($river) : null,
                'nearest_river' => $riverName,
            ],
        ];
    }

    /** [center elevation, [N, S, E, W elevations]] from SRTM 30 m, or null on failure. */
    private function elevations(float $lat, float $lng): ?array
    {
        $dLat = self::SLOPE_STEP_M / 111320;
        $dLng = self::SLOPE_STEP_M / (111320 * cos(deg2rad($lat)));
        $pts = [[$lat, $lng], [$lat + $dLat, $lng], [$lat - $dLat, $lng], [$lat, $lng + $dLng], [$lat, $lng - $dLng]];

        $key = sprintf('srtm30m:%.5f,%.5f', $lat, $lng);
        if ($cached = Cache::get($key)) {
            return $cached;
        }
        try {
            $res = Http::timeout(8)
                ->withUserAgent('GeoPermit/1.0')
                ->get('https://api.opentopodata.org/v1/srtm30m', [
                    'locations' => implode('|', array_map(fn($p) => sprintf('%.6f,%.6f', $p[0], $p[1]), $pts)),
                ]);
            $vals = array_column($res->json('results') ?? [], 'elevation');
        } catch (\Throwable) {
            return null;
        }
        if (! $res->successful() || count($vals) !== 5 || in_array(null, $vals, true)) {
            return null;
        }
        $result = [(float) $vals[0], array_map('floatval', array_slice($vals, 1))];
        Cache::put($key, $result, now()->addDays(30));
        return $result;
    }

    /** [distance in metres to the nearest feature of $kind, its name] (INF when none loaded). */
    private function nearest(float $lat, float $lng, string $kind): array
    {
        self::$water ??= json_decode(file_get_contents(resource_path('geo/bongabong-water.json')), true)['features'] ?? [];

        // Local equirectangular projection (metres) — accurate at municipal scale
        $kx = 111320 * cos(deg2rad($lat));
        $ky = 110540;
        $best = INF;
        $name = null;
        foreach (self::$water as $f) {
            if (($f['properties']['kind'] ?? null) !== $kind) {
                continue;
            }
            foreach ($f['geometry']['coordinates'] as $line) {
                for ($i = 1, $n = count($line); $i < $n; $i++) {
                    $d = $this->segmentDistance(
                        ($line[$i - 1][0] - $lng) * $kx, ($line[$i - 1][1] - $lat) * $ky,
                        ($line[$i][0] - $lng) * $kx, ($line[$i][1] - $lat) * $ky,
                    );
                    if ($d < $best) {
                        $best = $d;
                        $name = $f['properties']['name'] ?? null;
                    }
                }
            }
        }
        return [$best, $name];
    }

    /** Distance from the origin to segment (x1,y1)-(x2,y2). */
    private function segmentDistance(float $x1, float $y1, float $x2, float $y2): float
    {
        $dx = $x2 - $x1;
        $dy = $y2 - $y1;
        $len2 = $dx * $dx + $dy * $dy;
        $t = $len2 > 0 ? max(0, min(1, -($x1 * $dx + $y1 * $dy) / $len2)) : 0;
        return hypot($x1 + $t * $dx, $y1 + $t * $dy);
    }
}
