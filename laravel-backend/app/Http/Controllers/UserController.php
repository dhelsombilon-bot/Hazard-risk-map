<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /** Only System Administrators may list, add or edit user accounts. */
    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->loadMissing('role')->role?->role_name === 'System Administrator',
            403,
            'Only a System Administrator can manage user accounts.'
        );
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);
        $users = User::with('role')->orderBy('first_name')->paginate(50);
        $users->getCollection()->transform(fn($u) => $this->formatUser($u));
        return response()->json([
            'data' => $users->items(),
            'meta' => ['current_page' => $users->currentPage(), 'last_page' => $users->lastPage(), 'total' => $users->total(), 'per_page' => $users->perPage()],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:users,email',
            'role_id' => 'required|exists:roles,role_id',
            'is_active' => 'sometimes|boolean',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create($data + ['is_active' => true]);
        return response()->json($this->formatUser($user->load('role')), 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeAdmin($request);
        $user = User::findOrFail($id);

        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'email' => "sometimes|required|email|max:255|unique:users,email,$id,user_id",
            'role_id' => 'sometimes|required|exists:roles,role_id',
            'is_active' => 'sometimes|boolean',
            'password' => ['sometimes', 'nullable', 'confirmed', Password::min(8)],
        ]);

        if (array_key_exists('password', $data) && empty($data['password'])) {
            unset($data['password']);
        }

        // Prevent an admin from locking themselves out
        if ($user->user_id === $request->user()->user_id) {
            if (array_key_exists('is_active', $data) && ! $data['is_active']) {
                abort(422, 'You cannot deactivate your own account.');
            }
            if (array_key_exists('role_id', $data) && (int) $data['role_id'] !== (int) $user->role_id) {
                abort(422, 'You cannot change your own role.');
            }
        }

        $user->update($data);
        return response()->json($this->formatUser($user->load('role')));
    }

    private function formatUser(User $u): array
    {
        return [
            'user_id' => $u->user_id,
            'role_id' => $u->role_id,
            'role_name' => $u->role?->role_name,
            'first_name' => $u->first_name,
            'last_name' => $u->last_name,
            'email' => $u->email,
            'is_active' => $u->is_active,
            'created_at' => $u->created_at,
            'updated_at' => $u->updated_at,
        ];
    }
}
