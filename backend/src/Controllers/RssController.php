<?php

namespace App\Controllers;

use App\Services\RssServices;
use App\Repositories\UserRepository;

class RssController{
    private RssService $rssService;
    private UserRepository $userRepo;

    public function __construct(){
        $this->rssService=new RssService();
        $this->userRepo=new UserRepository();
    }

    public function getFeed() {
        if (!isset($_GET['token']) || empty(trim($_GET['token']))) {
            http_response_code(401);
            echo "Eroare: Lipseste token-ul de autentificare RSS.";
            exit;
        }

        $token = trim($_GET['token']);
        $user = $this->userRepo->findByRssToken($token);
        if (!$user) {
            http_response_code(401);
            echo "Eroare: Token RSS invalid sau expirat.";
            exit;
        }
        header('Content-Type: application/rss+xml; charset=utf-8');
        header('Cache-Control: no-cache, must-revalidate');
        echo $this->rssService->generateFeed($user);
        exit;
    }
}