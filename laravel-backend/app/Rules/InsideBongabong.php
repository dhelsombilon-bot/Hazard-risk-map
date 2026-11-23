<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that the request's latitude/longitude pair lies inside the
 * Bongabong municipal boundary (resources/geo/bongabong-boundary.json,
 * geoBoundaries PHL ADM3 — NAMRIA / PSA / OCHA 2020).
 *
 * Attach to the `latitude` field; it reads `longitude` from the same request.
 */
class InsideBongabong implements ValidationRule, DataAwareRule
{
    private array $data = [];

    private static ?array $ring = null;

    public function setData(array $data): static
    {
        $this->data = $data;
        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $lng = $this->data['longitude'] ?? null;
        if ($value === null || $value === '' || $lng === null || $lng === '') {
            return; // presence/pairing is handled by other rules
        }
        if (! is_numeric($value) || ! is_numeric($lng)) {
            return;
        }
        if (! self::contains((float) $value, (float) $lng)) {
            $fail('The location must be inside Bongabong, Oriental Mindoro.');
        }
    }

    public static function contains(float $lat, float $lng): bool
    {
        $ring = self::$ring ??= json_decode(
            file_get_contents(resource_path('geo/bongabong-boundary.json')), true
        )['geometry']['coordinates'][0];

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
}
