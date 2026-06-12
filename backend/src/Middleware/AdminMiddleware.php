<?php

/*
 * backend/src/Middleware/AdminMiddleware.php
 * Admin role guard — checks that the authenticated user has the
 * "admin" role. Returns 403 Forbidden if not.
 */

namespace App\Middleware;

class AdminMiddleware extends AuthMiddleware {

    public function handle(): bool {
        $parentResult = parent::handle();
        if (!$parentResult) {
            return false;
        }
        $user = self::getUser();

        if (!isset($user->role) || $user->role !== 'admin') {
            $this->abort(403, "Acces interzis. Această acțiune este rezervată administratorilor.");
            return false;
        }

        return true;
    }
}