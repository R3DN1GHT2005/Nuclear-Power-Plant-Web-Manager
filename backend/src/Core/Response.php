/*
 * backend/src/Core/Response.php
 * HTTP response helper — sends JSON responses with status codes,
 * CORS headers, and utility methods for 200/201/400/401/403/404/500.
 */
<?php

namespace App\Core;

class Response {
    public static function json(mixed $data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }
}