<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\NotificationRead;
use App\Models\Permit;
use App\Models\PermitFinding;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Notifications are derived from live records, so they are always current:
 *  - expired permits / permits expiring within 30 days
 *  - open permit findings
 *  - buildings that need review / have High hazard risk (one grouped item each)
 *
 * Each item has a stable `id`; read state is stored per user in notification_reads.
 */
class NotificationController extends Controller
{
    private const EXPIRY_WARNING_DAYS = 30;
    private const LIMIT = 50;

    public function index(Request $request)
    {
        $items = $this->build();
        $readKeys = NotificationRead::where('user_id', $request->user()->user_id)
            ->whereIn('notification_key', $items->pluck('id'))
            ->pluck('notification_key')
            ->flip();

        $items = $items->map(fn ($n) => $n + ['read' => isset($readKeys[$n['id']])])->values();

        return response()->json([
            'data' => $items,
            'unread_count' => $items->where('read', false)->count(),
        ]);
    }

    public function markRead(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array|max:200',
            'ids.*' => 'string|max:150',
        ]);
        $this->storeRead($request->user()->user_id, $data['ids']);
        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request)
    {
        $this->storeRead($request->user()->user_id, $this->build()->pluck('id')->all());
        return response()->json(['ok' => true]);
    }

    private function storeRead(int $userId, array $keys): void
    {
        $now = now();
        $rows = array_map(
            fn ($k) => ['user_id' => $userId, 'notification_key' => $k, 'read_at' => $now],
            array_values(array_unique($keys))
        );
        if ($rows) {
            NotificationRead::upsert($rows, ['user_id', 'notification_key'], ['read_at']);
        }
    }

    private function build(): Collection
    {
        $today = Carbon::today();
        $items = collect();

        // Expired and soon-to-expire permits
        $permits = Permit::with('building')
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', $today->copy()->addDays(self::EXPIRY_WARNING_DAYS))
            ->get();

        foreach ($permits as $p) {
            $expiry = Carbon::parse($p->expiry_date);
            $expired = $expiry->lt($today);
            $building = $p->building?->building_name ?? 'Unknown building';
            $items->push([
                'id' => ($expired ? 'permit-expired-' : 'permit-expiring-').$p->permit_id.'-'.$expiry->toDateString(),
                'type' => $expired ? 'permit_expired' : 'permit_expiring',
                'severity' => $expired ? 'high' : 'warning',
                'title' => $expired ? "Permit {$p->permit_number} has expired" : "Permit {$p->permit_number} expires soon",
                'message' => $building.' · '.($expired ? 'Expired ' : 'Expires ').$expiry->format('M j, Y'),
                'link' => "/permits/{$p->permit_id}",
                'date' => $expiry->toDateString(),
            ]);
        }

        // Open findings
        $findings = PermitFinding::with('permit')->where('status', 'Open')->get();
        foreach ($findings as $f) {
            $items->push([
                'id' => 'finding-open-'.$f->finding_id,
                'type' => 'finding_open',
                'severity' => in_array($f->severity, ['Critical', 'Major']) ? 'high' : 'warning',
                'title' => trim("{$f->severity} finding on permit ".($f->permit?->permit_number ?? '')),
                'message' => Str::limit($f->description, 90),
                'link' => $f->permit_id ? "/permits/{$f->permit_id}" : '/permits',
                'date' => ($f->reported_at ?? $f->created_at)?->toDateString(),
            ]);
        }

        // Buildings needing review (grouped; the id includes the count so a new batch re-alerts)
        $review = Building::whereHas('buildingStatus', fn ($q) => $q->where('status_name', 'Needs review'))->count();
        if ($review > 0) {
            $lastUpdated = Building::max('updated_at');
            $items->push([
                'id' => "buildings-review-{$review}",
                'type' => 'buildings_review',
                'severity' => 'info',
                'title' => $review === 1 ? '1 building record needs review' : "{$review} building records need review",
                'message' => 'Verify the location and details in the Building Inventory.',
                'link' => '/buildings',
                'date' => $lastUpdated ? Carbon::parse($lastUpdated)->toDateString() : null,
            ]);
        }

        // High hazard risk (grouped)
        $high = Building::whereHas('hazardAssessments', fn ($q) => $q->where('hazard_level', 'High'))->count();
        if ($high > 0) {
            $items->push([
                'id' => "buildings-high-risk-{$high}",
                'type' => 'high_risk',
                'severity' => 'high',
                'title' => $high === 1 ? '1 building has High hazard risk' : "{$high} buildings have High hazard risk",
                'message' => 'Review them on the Hazard Risk Map.',
                'link' => '/map',
                'date' => $today->toDateString(),
            ]);
        }

        return $items->sortByDesc('date')->take(self::LIMIT)->values();
    }
}
