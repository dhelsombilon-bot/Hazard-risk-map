<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('role_name', 'System Administrator')->value('role_id');
        $personnelRole = Role::where('role_name', 'MEO Personnel')->value('role_id');
        $managementRole = Role::where('role_name', 'MEO Management')->value('role_id');

        $users = [
            ['role_id' => $adminRole, 'first_name' => 'Admin', 'last_name' => 'User', 'email' => 'admin@geopermit.test', 'is_active' => true],
            ['role_id' => $personnelRole, 'first_name' => 'Personnel', 'last_name' => 'One', 'email' => 'personnel@geopermit.test', 'is_active' => true],
            ['role_id' => $managementRole, 'first_name' => 'Management', 'last_name' => 'User', 'email' => 'management@geopermit.test', 'is_active' => true],
            ['role_id' => $personnelRole, 'first_name' => 'Maria', 'last_name' => 'Santos', 'email' => 'msantos@geopermit.test', 'is_active' => true],
            ['role_id' => $personnelRole, 'first_name' => 'Juan', 'last_name' => 'Dela Cruz', 'email' => 'jdelacruz@geopermit.test', 'is_active' => false],
        ];

        foreach ($users as $u) {
            User::firstOrCreate(
                ['email' => $u['email']],
                array_merge($u, ['password' => Hash::make('password')])
            );
        }
    }
}
