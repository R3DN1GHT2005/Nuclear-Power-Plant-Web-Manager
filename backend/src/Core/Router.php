<?php

namespace App\Core;

class Router {
    private array $routes = [];

    // 1. Am adăugat un al 4-lea parametru opțional: array $middlewares = []
    public function get(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('GET', $path, $controller, $action, $middlewares);
    }

    public function post(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('POST', $path, $controller, $action, $middlewares);
    }

    public function put(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('PUT', $path, $controller, $action, $middlewares);
    }

    public function delete(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('DELETE', $path, $controller, $action, $middlewares);
    }

    private function addRoute(string $method, string $path, string $controller, string $action, array $middlewares): void {
        // Am lăsat logica ta de regex exact la fel
        $regexPath = preg_replace('/\{[a-zA-Z0-9_]+\}/', '(\d+)', $path);
        $regexPath = '#^' . $regexPath . '$#';

        $this->routes[] = [
            'method'      => $method,
            'path'        => $regexPath,
            'controller'  => $controller,
            'action'      => $action,
            'middlewares' => $middlewares // 2. Salvăm middleware-urile pentru această rută
        ];
    }

    // Execută cererea primită
    public function dispatch(string $uri, string $method): void {
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $uri, $matches)) {
                
                // Primul element din $matches este mereu tot URL-ul. Îl eliminăm
                array_shift($matches);

                // --- 3. NOU: EXECUȚIA MIDDLEWARE-URILOR ---
                // Parcurgem toate middleware-urile setate pe această rută
                foreach ($route['middlewares'] as $middlewareClass) {
                    $middlewareInstance = new $middlewareClass();
                    
                    // Apelăm metoda handle() din middleware
                    $middlewareResult = $middlewareInstance->handle();
                    
                    // Dacă middleware-ul returnează false, ne oprim complet. 
                    // (Cererea nu mai ajunge la Controller)
                    if ($middlewareResult === false) {
                        return; 
                    }
                }
                // ------------------------------------------

                // Dacă am trecut de middleware-uri, inițializăm Controller-ul
                $controllerInstance = new $route['controller']();
                
                // Apelăm metoda dorită din Controller
                call_user_func_array([$controllerInstance, $route['action']], $matches);
                return; // Oprim execuția
            }
        }

        // Dacă nu s-a găsit ruta (Eroare 404)
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "Endpoint-ul nu a fost găsit.",
            "url_primit" => $uri
        ]);
    }
}