<?php

namespace App\Http\Controllers;

use App\Rules\InsideBongabong;
use App\Models\Building;
use App\Models\BuildingActivityLog;
use App\Models\BuildingHazardAssessment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BuildingController extends Controller
{
    public function index(Request $request)
    {
        $query = Building::with(['barangay', 'buildingType', 'buildingStatus', 'hazardAssessments'])
            ->withCount('permits');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('building_name', 'like', "%$search%")
                  ->orWhere('building_code', 'like', "%$search%");
            });
        }

        if ($barangayId = $request->get('barangay_id')) {
            $query->where('barangay_id', $barangayId);
        }

        if ($typeId = $request->get('building_type_id')) {
            $query->where('building_type_id', $typeId);
        }

        $buildings = $query->orderBy('building_code')->paginate(15);

        $buildings->getCollection()->transform(fn($b) => $this->formatBuilding($b));

        return response()->json([
            'data' => $buildings->items(),
            'meta' => [
                'current_page' => $buildings->currentPage(),
                'last_page' => $buildings->lastPage(),
                'total' => $buildings->total(),
                'per_page' => $buildings->perPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $building = Building::with([
            'barangay', 'buildingType', 'buildingStatus',
            'hazardAssessments.hazardType',
            'landscapeFeatures',
            'activityLogs.user',
            'permits.permitType', 'permits.permitStatus',
        ])->findOrFail($id);

        return response()->json($this->formatBuilding($building, true));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'building_name' => 'required|string|max:255',
            'building_type_id' => 'required|exists:building_types,building_type_id',
            'building_status_id' => 'required|exists:building_statuses,building_status_id',
            'barangay_id' => 'required|exists:barangays,barangay_id',
            'street_address' => 'nullable|string',
            'managing_office' => 'nullable|string',
            'year_built' => 'nullable|integer|min:1900|max:2099',
            'description' => 'nullable|string',
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude', new InsideBongabong],
            'longitude' => 'nullable|numeric|between:-180,180|required_with:latitude',
            'elevation_m' => 'nullable|numeric',
            'coordinate_source' => 'nullable|string|max:50',
            // Optional: hazard assessments detected/entered on the Add Building form
            'hazards' => 'sometimes|array',
            'hazards.*.hazard_type_id' => 'required|exists:hazard_types,hazard_type_id',
            'hazards.*.hazard_level' => 'required|exists:hazard_levels,level_name',
            'hazards.*.dataset_name' => 'nullable|string|max:255',
            'hazards.*.assessment_date' => 'nullable|date',
            'hazards.*.assessment_notes' => 'nullable|string',
        ]);

        $hazards = $data['hazards'] ?? null;
        unset($data['hazards']);

        $data['building_code'] = $this->generateCode();
        $data['created_by'] = $request->user()->user_id;

        $building = DB::transaction(function () use ($data, $hazards, $request) {
            $building = Building::create($data);

            BuildingActivityLog::create([
                'building_id' => $building->building_id,
                'user_id' => $request->user()->user_id,
                'action' => 'Created building record',
            ]);

            if ($hazards) {
                $this->syncHazards($building, $hazards, $request->user()->user_id, 'Recorded hazard risk assessments');
            }

            return $building;
        });

        return response()->json($this->formatBuilding($building->load(['barangay', 'buildingType', 'buildingStatus'])), 201);
    }

    public function update(Request $request, $id)
    {
        $building = Building::findOrFail($id);

        $data = $request->validate([
            'building_name' => 'sometimes|required|string|max:255',
            'building_type_id' => 'sometimes|required|exists:building_types,building_type_id',
            'building_status_id' => 'sometimes|required|exists:building_statuses,building_status_id',
            'barangay_id' => 'sometimes|required|exists:barangays,barangay_id',
            'street_address' => 'nullable|string',
            'managing_office' => 'nullable|string',
            'year_built' => 'nullable|integer|min:1900|max:2099',
            'description' => 'nullable|string',
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude', new InsideBongabong],
            'longitude' => 'nullable|numeric|between:-180,180|required_with:latitude',
            'elevation_m' => 'nullable|numeric',
            'coordinate_source' => 'nullable|string|max:50',
            // Optional: full replacement set of hazard assessments for this building
            'hazards' => 'sometimes|array',
            'hazards.*.hazard_assessment_id' => 'nullable|integer',
            'hazards.*.hazard_type_id' => 'required|exists:hazard_types,hazard_type_id',
            'hazards.*.hazard_level' => 'required|exists:hazard_levels,level_name',
            'hazards.*.dataset_name' => 'nullable|string|max:255',
            'hazards.*.assessment_date' => 'nullable|date',
            'hazards.*.assessment_notes' => 'nullable|string',
        ]);

        $hazards = $data['hazards'] ?? null;
        unset($data['hazards']);

        DB::transaction(function () use ($building, $data, $hazards, $request) {
            $old = $building->getAttributes();
            $building->update($data);

            BuildingActivityLog::create([
                'building_id' => $building->building_id,
                'user_id' => $request->user()->user_id,
                'action' => 'Updated building record',
                'old_values' => array_intersect_key($old, $data),
                'new_values' => $data,
            ]);

            if ($hazards !== null) {
                $this->syncHazards($building, $hazards, $request->user()->user_id);
            }
        });

        // Return the full record (same shape as show) so the client can update its cache without refetching
        return response()->json($this->formatBuilding($building->load([
            'barangay', 'buildingType', 'buildingStatus',
            'hazardAssessments.hazardType',
            'landscapeFeatures',
            'activityLogs.user',
            'permits.permitType', 'permits.permitStatus',
        ]), true));
    }

    public function geojson(Request $request)
    {
        $buildings = Building::with(['barangay', 'buildingType', 'buildingStatus', 'hazardAssessments.hazardType'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        $features = $buildings->map(fn($b) => [
            'type' => 'Feature',
            'geometry' => ['type' => 'Point', 'coordinates' => [$b->longitude, $b->latitude]],
            'properties' => [
                'building_id' => $b->building_id,
                'building_code' => $b->building_code,
                'building_name' => $b->building_name,
                'building_type' => $b->buildingType?->type_name,
                'building_status' => $b->buildingStatus?->status_name,
                'barangay_id' => $b->barangay_id,
                'barangay_name' => $b->barangay?->barangay_name,
                'risk_level' => $b->risk_level,
                // Per-hazard levels, e.g. ['Flood' => 'High', 'Landslide' => 'Low']
                'hazard_levels' => $this->hazardLevels($b),
            ],
        ]);

        return response()->json(['type' => 'FeatureCollection', 'features' => $features]);
    }

    /** Replace the building's hazard assessments with the submitted set (update / create / delete). */
    private function syncHazards(Building $building, array $hazards, int $userId, string $action = 'Updated hazard risk assessments'): void
    {
        $existing = $building->hazardAssessments()->get()->keyBy('hazard_assessment_id');
        $keep = [];

        foreach ($hazards as $h) {
            $attrs = [
                'hazard_type_id' => $h['hazard_type_id'],
                'hazard_level' => $h['hazard_level'],
                'dataset_name' => $h['dataset_name'] ?? null,
                'assessment_date' => $h['assessment_date'] ?? null,
                'assessment_notes' => $h['assessment_notes'] ?? null,
            ];
            $id = $h['hazard_assessment_id'] ?? null;

            if ($id && $existing->has($id)) {
                $existing[$id]->update($attrs);
                $keep[] = $id;
            } else {
                $keep[] = $building->hazardAssessments()->create($attrs)->hazard_assessment_id;
            }
        }

        $removed = $existing->keys()->diff($keep);
        if ($removed->isNotEmpty()) {
            BuildingHazardAssessment::whereIn('hazard_assessment_id', $removed)->delete();
        }

        BuildingActivityLog::create([
            'building_id' => $building->building_id,
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => 'hazard',
        ]);
    }

    /** Highest assessed level per hazard type (a building may have several assessments). */
    private function hazardLevels(Building $b): array
    {
        $order = ['High' => 4, 'Moderate-to-High' => 3, 'Moderate' => 2, 'Low' => 1];
        $levels = [];
        foreach ($b->hazardAssessments as $h) {
            $type = $h->hazard_type;
            if (! $type) {
                continue;
            }
            if (! isset($levels[$type]) || ($order[$h->hazard_level] ?? 0) > ($order[$levels[$type]] ?? 0)) {
                $levels[$type] = $h->hazard_level;
            }
        }
        return $levels;
    }

    private function formatBuilding(Building $b, bool $full = false): array
    {
        $data = [
            'building_id' => $b->building_id,
            'building_code' => $b->building_code,
            'building_name' => $b->building_name,
            'building_type_id' => $b->building_type_id,
            'building_type' => $b->buildingType?->type_name,
            'building_status_id' => $b->building_status_id,
            'building_status' => $b->buildingStatus?->status_name,
            'barangay_id' => $b->barangay_id,
            'barangay_name' => $b->barangay?->barangay_name,
            'street_address' => $b->street_address,
            'managing_office' => $b->managing_office,
            'year_built' => $b->year_built,
            'description' => $b->description,
            'latitude' => $b->latitude,
            'longitude' => $b->longitude,
            'elevation_m' => $b->elevation_m,
            'coordinate_source' => $b->coordinate_source,
            'risk_level' => $b->risk_level,
            'created_at' => $b->created_at,
            'updated_at' => $b->updated_at,
        ];

        if ($full) {
            $data['hazards'] = $b->hazardAssessments?->map(fn($h) => [
                'hazard_assessment_id' => $h->hazard_assessment_id,
                'hazard_type_id' => $h->hazard_type_id,
                'hazard_type' => $h->hazard_type,
                'hazard_level' => $h->hazard_level,
                'dataset_name' => $h->dataset_name,
                'assessment_date' => $h->assessment_date,
                'assessment_notes' => $h->assessment_notes,
            ]);
            $data['landscape'] = $b->landscapeFeatures;
            $data['activity'] = $b->activityLogs?->sortByDesc('created_at')->map(fn($l) => [
                'log_id' => $l->log_id,
                'user_name' => $l->user_name,
                'action' => $l->action,
                'entity_type' => $l->entity_type,
                'created_at' => $l->created_at,
            ]);
            $data['permits'] = $b->permits?->map(fn($p) => [
                'permit_id' => $p->permit_id,
                'permit_number' => $p->permit_number,
                'permit_type' => $p->permit_type,
                'permit_status' => $p->permit_status,
                'issue_date' => $p->issue_date,
                'expiry_date' => $p->expiry_date,
            ]);
        }

        return $data;
    }

    private function generateCode(): string
    {
        $max = Building::max('building_id') ?? 0;
        return 'GP-' . str_pad($max + 1, 4, '0', STR_PAD_LEFT);
    }
}
