<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use App\Models\Permit;
use App\Models\PermitDocument;
use App\Models\PermitFinding;
use Illuminate\Http\Request;

class PermitController extends Controller
{
    public function index(Request $request)
    {
        $query = Permit::with(['building.barangay', 'permitType', 'permitStatus']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('permit_number', 'like', "%$search%")
                  ->orWhereHas('building', fn($bq) => $bq->where('building_name', 'like', "%$search%"));
            });
        }

        if ($status = $request->get('permit_status')) {
            $query->whereHas('permitStatus', fn($q) => $q->where('status_name', $status));
        }

        if ($buildingId = $request->get('building_id')) {
            $query->where('building_id', $buildingId);
        }

        $permits = $query->orderByDesc('created_at')->paginate(15);
        $permits->getCollection()->transform(fn($p) => $this->formatPermit($p));

        return response()->json([
            'data' => $permits->items(),
            'meta' => [
                'current_page' => $permits->currentPage(),
                'last_page' => $permits->lastPage(),
                'total' => $permits->total(),
                'per_page' => $permits->perPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $permit = Permit::with([
            'building.barangay', 'permitType', 'permitStatus',
            'documents.documentType', 'complianceChecks.checker',
            'findings.reporter',
        ])->findOrFail($id);

        $docTypes = DocumentType::where('is_required', true)->get();
        $existingDocs = $permit->documents->keyBy('document_type_id');
        $documents = $docTypes->map(fn($dt) => [
            'document_type_id' => $dt->document_type_id,
            'document_type' => $dt->document_name,
            'is_present' => $existingDocs->has($dt->document_type_id),
            'file_name' => $existingDocs[$dt->document_type_id]?->file_name ?? null,
            'document_reference' => $existingDocs[$dt->document_type_id]?->document_reference ?? null,
            'uploaded_at' => $existingDocs[$dt->document_type_id]?->uploaded_at ?? null,
            'verification_status' => $existingDocs[$dt->document_type_id]?->verification_status ?? 'Missing',
        ]);

        $data = $this->formatPermit($permit);
        $data['documents'] = $documents;
        $data['compliance_checks'] = $permit->complianceChecks->map(fn($c) => [
            'check_id' => $c->check_id,
            'check_type' => $c->check_type,
            'result' => $c->result,
            'checked_by' => $c->checker ? $c->checker->first_name.' '.$c->checker->last_name : '',
            'checked_at' => $c->checked_at,
            'notes' => $c->notes,
        ]);
        $data['findings'] = $permit->findings->map(fn($f) => [
            'finding_id' => $f->finding_id,
            'severity' => $f->severity,
            'description' => $f->description,
            'status' => $f->status,
            'reported_by' => $f->reporter ? $f->reporter->first_name.' '.$f->reporter->last_name : '',
            'reported_at' => $f->reported_at,
            'resolution_notes' => $f->resolution_notes,
        ]);

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'building_id' => 'required|exists:buildings,building_id',
            'permit_type_id' => 'required|exists:permit_types,permit_type_id',
            'permit_status_id' => 'required|exists:permit_statuses,permit_status_id',
            'permit_number' => 'required|string|max:50|unique:permits,permit_number',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:issue_date',
            'issuing_authority' => 'nullable|string',
            'permit_fee_amount' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        $data['recorded_by'] = $request->user()->user_id;
        $permit = Permit::create($data);

        return response()->json($this->formatPermit($permit->load(['building.barangay', 'permitType', 'permitStatus'])), 201);
    }

    public function update(Request $request, $id)
    {
        $permit = Permit::findOrFail($id);

        $data = $request->validate([
            'permit_type_id' => 'sometimes|required|exists:permit_types,permit_type_id',
            'permit_status_id' => 'sometimes|required|exists:permit_statuses,permit_status_id',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'issuing_authority' => 'nullable|string',
            'permit_fee_amount' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        $permit->update($data);

        return response()->json($this->formatPermit($permit->load(['building.barangay', 'permitType', 'permitStatus'])));
    }

    public function resolveFinding(Request $request, $findingId)
    {
        $finding = PermitFinding::findOrFail($findingId);
        $finding->update([
            'status' => 'Resolved',
            'resolved_by' => $request->user()->user_id,
            'resolved_at' => now(),
            'resolution_notes' => $request->get('resolution_notes'),
        ]);
        return response()->json($finding);
    }

    private function formatPermit(Permit $p): array
    {
        return [
            'permit_id' => $p->permit_id,
            'permit_number' => $p->permit_number,
            'permit_type' => $p->permit_type,
            'permit_type_id' => $p->permit_type_id,
            'permit_status' => $p->permit_status,
            'permit_status_id' => $p->permit_status_id,
            'building_id' => $p->building_id,
            'building_name' => $p->building?->building_name,
            'building_code' => $p->building?->building_code,
            'barangay_name' => $p->building?->barangay?->barangay_name,
            'issue_date' => $p->issue_date,
            'expiry_date' => $p->expiry_date,
            'issuing_authority' => $p->issuing_authority,
            'permit_fee_amount' => $p->permit_fee_amount,
            'remarks' => $p->remarks,
            'recorded_by' => $p->recorder ? $p->recorder->first_name.' '.$p->recorder->last_name : null,
            'created_at' => $p->created_at,
            'updated_at' => $p->updated_at,
        ];
    }
}
