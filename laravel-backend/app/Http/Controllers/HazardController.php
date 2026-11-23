<?php

namespace App\Http\Controllers;

use App\Models\HazardLayer;
use App\Models\HazardType;
use App\Rules\InsideBongabong;
use App\Services\HazardEstimator;
use Illuminate\Http\Request;

class HazardController extends Controller
{
    public function layers(Request $request)
    {
        $hazardType = $request->get('hazard_type', 'flood');

        $layer = HazardLayer::whereHas('hazardType', fn($q) => $q->where('hazard_name', 'like', $hazardType))
            ->where('is_active', true)
            ->latest()
            ->first();

        if (!$layer) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        return response()->json(json_decode($layer->geojson, true) ?? ['type' => 'FeatureCollection', 'features' => []]);
    }

    /**
     * Hazard exposure of an arbitrary point (e.g. a vacant lot for a future building).
     * Checks the point against the same active hazard_layers polygons the map draws.
     * Official layers win; a hazard with no official layer uses the GeoPermit estimate
     * (source 'estimate'), and is reported as 'no_data' only if that can't be computed either.
     */
    public function assess(Request $request)
    {
        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90', new InsideBongabong],
            'longitude' => 'required|numeric|between:-180,180',
        ]);
        $lat = (float) $data['latitude'];
        $lng = (float) $data['longitude'];

        $order = ['High' => 4, 'Moderate-to-High' => 3, 'Moderate' => 2, 'Low' => 1];
        $hazards = [];
        $estimator = new HazardEstimator;
        $estimate = null; // fetched at most once, only if some hazard has no official map

        foreach (HazardType::orderBy('hazard_type_id')->get() as $type) {
            $layer = HazardLayer::where('hazard_type_id', $type->hazard_type_id)
                ->where('is_active', true)
                ->latest()
                ->first();
            $features = $layer ? (json_decode($layer->geojson, true)['features'] ?? []) : [];

            if (! $layer || ! $features) {
                // No official map loaded → fall back to the GeoPermit estimate (same method as seeded buildings)
                $estimate ??= $estimator->estimate($lat, $lng) ?: false;
                $hazards[$type->hazard_name] = $estimate && isset($estimate[$type->hazard_name])
                    ? [
                        'status' => 'exposed',
                        'level' => $estimate[$type->hazard_name],
                        'source' => 'estimate',
                        'dataset' => [
                            'dataset_name' => HazardEstimator::DATASET,
                            'source_agency' => HazardEstimator::SOURCE,
                            'data_year' => null,
                            'notes' => HazardEstimator::NOTES,
                        ],
                        'inputs' => $estimate['inputs'],
                    ]
                    : ['status' => 'no_data', 'level' => null, 'dataset' => null];
                continue;
            }

            // Highest level among all polygons containing the point
            $level = null;
            foreach ($features as $f) {
                $l = $f['properties']['level'] ?? null;
                if ($l && $this->geometryContains($f['geometry'] ?? null, $lat, $lng)
                    && ($level === null || ($order[$l] ?? 0) > ($order[$level] ?? 0))) {
                    $level = $l;
                }
            }

            $hazards[$type->hazard_name] = [
                'status' => $level ? 'exposed' : 'no_identified_exposure',
                'level' => $level,
                'source' => 'official',
                'dataset' => [
                    'dataset_name' => $layer->dataset_name,
                    'source_agency' => $layer->source_agency,
                    'data_year' => $layer->data_year,
                ],
            ];
        }

        // Overall: highest exposed level; "no identified exposure" only when every hazard has data
        $exposed = array_filter($hazards, fn($h) => $h['status'] === 'exposed');
        if ($exposed) {
            $levels = array_column($exposed, 'level');
            usort($levels, fn($a, $b) => ($order[$b] ?? 0) <=> ($order[$a] ?? 0));
            $overall = ['status' => 'exposed', 'level' => $levels[0]];
        } elseif ($hazards && ! array_filter($hazards, fn($h) => $h['status'] === 'no_data')) {
            $overall = ['status' => 'no_identified_exposure', 'level' => null];
        } else {
            $overall = ['status' => 'no_data', 'level' => null];
        }

        return response()->json([
            'latitude' => $lat,
            'longitude' => $lng,
            'hazards' => $hazards,
            'overall' => $overall,
        ]);
    }

    /** Point-in-polygon for GeoJSON Polygon / MultiPolygon (holes respected). */
    private function geometryContains(?array $geometry, float $lat, float $lng): bool
    {
        $polygons = match ($geometry['type'] ?? null) {
            'Polygon' => [$geometry['coordinates']],
            'MultiPolygon' => $geometry['coordinates'],
            default => [],
        };
        foreach ($polygons as $rings) {
            if (! $rings || ! $this->ringContains($rings[0], $lat, $lng)) {
                continue;
            }
            $inHole = false;
            foreach (array_slice($rings, 1) as $hole) {
                if ($this->ringContains($hole, $lat, $lng)) { $inHole = true; break; }
            }
            if (! $inHole) {
                return true;
            }
        }
        return false;
    }

    private function ringContains(array $ring, float $lat, float $lng): bool
    {
        $inside = false;
        for ($i = 0, $j = count($ring) - 1; $i < count($ring); $j = $i++) {
            [$xi, $yi] = $ring[$i];
            [$xj, $yj] = $ring[$j];
            if (($yi > $lat) !== ($yj > $lat) && $lng < ($xj - $xi) * ($lat - $yi) / ($yj - $yi) + $xi) {
                $inside = ! $inside;
            }
        }
        return $inside;
    }

    public function barangayBoundaries()
    {
        // Returns an empty GeoJSON if no boundaries stored; front-end handles gracefully
        return response()->json(['type' => 'FeatureCollection', 'features' => []]);
    }
}
