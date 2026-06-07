<?php

namespace App\Middleware;

use App\Core\Response;

class ManagerOrAdminMiddleware extends AuthMiddleware {
    public function handle(): bool {
        if (!parent::handle()) {
            return false;
        }

        $user = AuthMiddleware::getUser();
        $role = $user->role ?? '';

        if ($role !== 'admin' && $role !== 'manager') {
            $this->abort(403, "Acces interzis. Necesită rol de admin sau manager.");
            return false;
        }

        return true;
    }
}
