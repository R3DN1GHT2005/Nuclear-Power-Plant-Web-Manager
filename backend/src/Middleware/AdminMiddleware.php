<?php
namespace App\Middleware;

class AdminMiddleware extends AuthMiddleware {

    public function handle(): bool {
        // 1. Apelăm metoda handle() din AuthMiddleware pentru a verifica token-ul
        $parentResult = parent::handle();
        
        // Dacă token-ul a fost invalid, părintele a trimis deja eroarea, noi doar oprim execuția aici
        if (!$parentResult) {
            return false;
        }

        // 2. Token-ul este valid. Acum verificăm rolul.
        // Preluăm user-ul care a fost salvat de clasa părinte (AuthMiddleware)
        $user = self::getUser();

        if (!isset($user->role) || $user->role !== 'admin') {
            $this->abort(403, "Acces interzis. Această acțiune este rezervată administratorilor.");
            return false;
        }

        // 3. Dacă a trecut și de verificarea de admin, lăsăm execuția să ajungă la Controller
        return true;
    }
}