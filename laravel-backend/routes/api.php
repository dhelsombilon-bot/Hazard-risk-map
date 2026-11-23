<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\HazardController;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PermitController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Lookups
    Route::get('/lookups', [LookupController::class, 'all']);

    // Notifications (bell in the header)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Buildings
    Route::get('/buildings/geojson', [BuildingController::class, 'geojson']);
    Route::get('/buildings', [BuildingController::class, 'index']);
    Route::post('/buildings', [BuildingController::class, 'store']);
    Route::get('/buildings/{id}', [BuildingController::class, 'show']);
    Route::put('/buildings/{id}', [BuildingController::class, 'update']);
    Route::patch('/buildings/{id}', [BuildingController::class, 'update']);

    // Permits
    Route::get('/permits', [PermitController::class, 'index']);
    Route::post('/permits', [PermitController::class, 'store']);
    Route::get('/permits/{id}', [PermitController::class, 'show']);
    Route::put('/permits/{id}', [PermitController::class, 'update']);
    Route::patch('/permits/{id}', [PermitController::class, 'update']);
    Route::put('/permit-findings/{id}', [PermitController::class, 'resolveFinding']);
    Route::put('/findings/{id}', [PermitController::class, 'resolveFinding']); // path used by the React app

    // Hazards
    Route::get('/hazards/layers', [HazardController::class, 'layers']);
    Route::get('/hazards/assess', [HazardController::class, 'assess']); // hazard exposure of any point (future building sites)
    Route::get('/landscape/layers', [HazardController::class, 'barangayBoundaries']);

    // Reports
    Route::get('/reports/preview', [ReportController::class, 'preview']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'generate']);
    Route::get('/reports/{id}/download', [ReportController::class, 'download']);

    // Users (admin only)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::patch('/users/{id}', [UserController::class, 'update']);
});
