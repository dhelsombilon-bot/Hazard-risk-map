<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['role_name' => 'System Administrator', 'description' => 'Full access including user management'],
            ['role_name' => 'MEO Personnel', 'description' => 'Add, edit, and review building and permit records'],
            ['role_name' => 'MEO Management', 'description' => 'View-only access to dashboard, maps, and reports'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['role_name' => $role['role_name']], $role);
        }
    }
}
