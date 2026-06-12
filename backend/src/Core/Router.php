<?php

/*
 * backend/src/Core/Router.php
 * HTTP router — registers GET/POST/PUT/PATCH/DELETE routes with
 * path parameters ({id}, {mac}) and middleware chains. Dispatches
 * requests to controller actions with parameter injection.
 */


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
        

        

        

        
        $regexPath = preg_replace_callback('/\{([a-zA-Z0-9_]+)\}/', function($matches) {
            if ($matches[1] === 'mac') {
                return '([a-zA-Z0-9:]+)'; 

            }
            return '(\d+)'; 

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
                return; 

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