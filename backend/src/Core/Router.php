<?php

namespace App\Core;

class Router {
    private array $routes = [];

   
    public function get(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('GET', $path, $controller, $action, $middlewares);
    }

    public function post(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('POST', $path, $controller, $action, $middlewares);
    }

    public function put(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('PUT', $path, $controller, $action, $middlewares);
    }

    public function patch(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('PATCH', $path, $controller, $action, $middlewares);
    }

    public function delete(string $path, string $controller, string $action, array $middlewares = []): void {
        $this->addRoute('DELETE', $path, $controller, $action, $middlewares);
    }

    private function addRoute(string $method, string $path, string $controller, string $action, array $middlewares): void {
        // În loc să transformăm totul în (\d+), folosim un regex mai permisiv
        // {mac} va fi transformat în ([a-zA-Z0-9:]+)
        // {id} va fi transformat în (\d+)
        
        $regexPath = preg_replace_callback('/\{([a-zA-Z0-9_]+)\}/', function($matches) {
            if ($matches[1] === 'mac') {
                return '([a-zA-Z0-9:]+)'; // Permitem litere, cifre și ':' pentru MAC
            }
            return '(\d+)'; // Pentru orice altceva ({id}), rămânem la numere
        }, $path);

        $regexPath = '#^' . $regexPath . '$#';

        $this->routes[] = [
            'method'      => $method,
            'path'        => $regexPath,
            'controller'  => $controller,
            'action'      => $action,
            'middlewares' => $middlewares 
        ];
    }
    // Execută cererea primită
    public function dispatch(string $uri, string $method): void {
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $uri, $matches)) {
                
                array_shift($matches);

                foreach ($route['middlewares'] as $middlewareClass) {
                    $middlewareInstance = new $middlewareClass();
                    $middlewareResult = $middlewareInstance->handle();
                    if ($middlewareResult === false) {
                        return; 
                    }
                }

                $controllerInstance = new $route['controller']();
                
                call_user_func_array([$controllerInstance, $route['action']], $matches);
                return; // Oprim execuția
            }
        }


        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "Endpoint-ul nu a fost găsit.",
            "url_primit" => $uri
        ]);
    }
}