<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\DocumentType;
use App\Models\Permit;
use App\Models\PermitComplianceCheck;
use App\Models\PermitDocument;
use App\Models\PermitFinding;
use App\Models\PermitStatus;
use App\Models\PermitType;
use App\Models\User;
use Illuminate\Database\Seeder;

class PermitSeeder extends Seeder
{
    public function run(): void
    {
        $personnel = User::where('email', 'personnel@geopermit.test')->first();

        $pType = fn($n) => PermitType::where('type_name', $n)->value('permit_type_id');
        $pStatus = fn($n) => PermitStatus::where('status_name', $n)->value('permit_status_id');
        $bId = fn($code) => Building::where('building_code', $code)->value('building_id');
        $docType = fn($n) => DocumentType::where('document_name', $n)->value('document_type_id');

        $permits = [
            ['permit_number'=>'BP-2026-001','building_code'=>'GP-0001','type'=>'Building Permit','status'=>'Compliant','issue_date'=>'2020-03-15','expiry_date'=>'2025-03-14','remarks'=>'All documents complete and verified.','docs'=>['Building Permit','Occupancy Permit','Fire Safety Certificate','Sanitary Permit']],
            ['permit_number'=>'BP-2026-002','building_code'=>'GP-0002','type'=>'Building Permit','status'=>'Compliant','issue_date'=>'2019-06-20','expiry_date'=>'2024-06-19','remarks'=>'Permit renewed on time.','docs'=>['Building Permit','Occupancy Permit','Fire Safety Certificate','Sanitary Permit']],
            ['permit_number'=>'BP-2026-003','building_code'=>'GP-0003','type'=>'Building Permit','status'=>'For review','issue_date'=>'2018-09-10','expiry_date'=>'2023-09-09','remarks'=>'Needs updated fire safety certificate.','docs'=>['Building Permit','Occupancy Permit','Sanitary Permit']],
            ['permit_number'=>'BP-2026-004','building_code'=>'GP-0004','type'=>'Building Permit','status'=>'Compliant','issue_date'=>'2021-01-05','expiry_date'=>'2026-01-04','remarks'=>'Current permit valid.','docs'=>['Building Permit','Occupancy Permit','Fire Safety Certificate','Sanitary Permit']],
            ['permit_number'=>'BP-2026-005','building_code'=>'GP-0005','type'=>'Building Permit','status'=>'Incomplete','issue_date'=>'2017-07-22','expiry_date'=>'2022-07-21','remarks'=>'Missing occupancy permit and sanitary permit.','docs'=>['Building Permit','Fire Safety Certificate']],
            ['permit_number'=>'BP-2026-006','building_code'=>'GP-0006','type'=>'Building Permit','status'=>'Compliant','issue_date'=>'2022-04-11','expiry_date'=>'2027-04-10','remarks'=>'All documents on file.','docs'=>['Building Permit','Occupancy Permit','Fire Safety Certificate','Sanitary Permit']],
            ['permit_number'=>'BP-2026-007','building_code'=>'GP-0007','type'=>'Building Permit','status'=>'For review','issue_date'=>'2016-11-30','expiry_date'=>'2021-11-29','remarks'=>'Expired permit. Needs renewal documents.','docs'=>['Building Permit','Occupancy Permit','Fire Safety Certificate']],
            ['permit_number'=>'BP-2026-008','building_code'=>'GP-0008','type'=>'Building Permit','status'=>'Compliant','issue_date'=>'2020-08-15','expiry_date'=>'2025-08-14','remarks'=>'Valid.','docs'=>['Building Permit','Occupancy Permit','Fire Safety Certificate','Sanitary Permit']],
            ['permit_number'=>'BP-2026-009','building_code'=>'GP-0009','type'=>'Building Permit','status'=>'Incomplete','issue_date'=>'2015-05-20','expiry_date'=>'2020-05-19','remarks'=>'Permit expired. Missing documents.','docs'=>['Building Permit','Fire Safety Certificate']],
            ['permit_number'=>'BP-2026-010','building_code'=>'GP-0010','type'=>'Occupancy Permit','status'=>'Compliant','issue_date'=>'2023-02-14','expiry_date'=>'2028-02-13','remarks'=>'New facility, complete documents.','docs'=>['Building Permit','Occupancy Permit','Fire Safety Certificate','Sanitary Permit']],
        ];

        foreach ($permits as $pd) {
            $permit = Permit::firstOrCreate(['permit_number' => $pd['permit_number']], [
                'permit_number' => $pd['permit_number'],
                'building_id' => $bId($pd['building_code']),
                'permit_type_id' => $pType($pd['type']),
                'permit_status_id' => $pStatus($pd['status']),
                'issue_date' => $pd['issue_date'],
                'expiry_date' => $pd['expiry_date'],
                'issuing_authority' => 'Office of the Building Official',
                'remarks' => $pd['remarks'],
                'recorded_by' => $personnel->user_id,
            ]);

            if ($permit->wasRecentlyCreated) {
                foreach ($pd['docs'] as $docName) {
                    PermitDocument::create([
                        'permit_id' => $permit->permit_id,
                        'document_type_id' => $docType($docName),
                        'file_path' => 'docs/'.$permit->permit_number.'-'.strtolower(str_replace(' ', '-', $docName)).'.pdf',
                        'file_name' => $permit->permit_number.'-'.$docName.'.pdf',
                        'date_submitted' => $pd['issue_date'],
                        'verification_status' => 'Verified',
                        'uploaded_by' => $personnel->user_id,
                        'uploaded_at' => now(),
                    ]);
                }

                // Add a compliance check for compliant permits
                if ($pd['status'] === 'Compliant') {
                    $check = PermitComplianceCheck::create([
                        'permit_id' => $permit->permit_id,
                        'check_type' => 'Document Verification',
                        'result' => 'Pass',
                        'checked_by' => $personnel->user_id,
                        'checked_at' => now(),
                        'notes' => 'All documents valid and current.',
                    ]);
                }

                // Add finding for permit BP-2026-003
                if ($pd['permit_number'] === 'BP-2026-003') {
                    $check = PermitComplianceCheck::create([
                        'permit_id' => $permit->permit_id,
                        'check_type' => 'Document Verification',
                        'result' => 'Fail',
                        'checked_by' => $personnel->user_id,
                        'checked_at' => now(),
                        'notes' => 'Fire Safety Certificate expired.',
                    ]);
                    PermitFinding::create([
                        'permit_id' => $permit->permit_id,
                        'check_id' => $check->check_id,
                        'severity' => 'Major',
                        'description' => 'Fire Safety Certificate has expired and needs renewal.',
                        'status' => 'Open',
                        'reported_by' => $personnel->user_id,
                        'reported_at' => now(),
                    ]);
                }
            }
        }
    }
}
