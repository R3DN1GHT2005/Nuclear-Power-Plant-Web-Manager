<?php

namespace App\Core;

class Router {
    private array $routes = [];

    public function get(string $path, string $controller, string $action): void {
        $this->addRoute('GET', $path, $controller, $action);
    }

    public function post(string $path, string $controller, string $action): void {
        $this->addRoute('POST', $path, $controller, $action);
    }

    public function put(string $path, string $controller, string $action): void {
        $this->addRoute('PUT', $path, $controller, $action);
    }

    public function delete(string $path, string $controller, string $action): void {
        $this->addRoute('DELETE', $path, $controller, $action);
    }

    private function addRoute(string $method, string $path, string $controller, string $action): void {
        // Convertim calea cu parametri (ex: /api/reactors/{id}) într-o expresie regulată (ex: #^/api/reactors/(\d+)$#)
        $regexPath = preg_replace('/\{[a-zA-Z0-9_]+\}/', '(\d+)', $path);
        $regexPath = '#^' . $regexPath . '$#';

        $this->routes[] = [
            'method'     => $method,
            'path'       => $regexPath,
            'controller' => $controller,
            'action'     => $action
        ];
    }

    
    //executa cererea primita
    public function dispatch(string $uri, string $method): void {
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $uri, $matches)) {
                
                // Primul element din $matches este mereu tot URL-ul. Îl eliminăm pentru a păstra doar parametrii (ex: ID-ul)
                array_shift($matches);

                // Inițializăm clasa Controller-ului
                $controllerInstance = new $route['controller']();
                
                // Apelăm metoda dorită din Controller și îi trimitem parametrii din URL
                call_user_func_array([$controllerInstance, $route['action']], $matches);
                return; // Oprim execuția pentru că am găsit și procesat ruta
            }
        }

        // Dacă bucla se termină fără să dea return, înseamnă că ruta nu există (Eroare 404)
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "Endpoint-ul nu a fost găsit.",
            "url_primit" => $uri
        ]);
    }
}