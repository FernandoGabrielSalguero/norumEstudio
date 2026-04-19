<?php

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/contact-submit.config.php';

if (is_file($configPath)) {
    require $configPath;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Metodo no permitido.',
    ]);
    exit;
}

$apiEndpoint = defined('CONTACT_API_ENDPOINT')
    ? CONTACT_API_ENDPOINT
    : (getenv('CONTACT_API_ENDPOINT') ?: 'https://norumestudio.com.ar/API/contact_form_landing_page/index.php');
$apiKey = defined('CONTACT_API_KEY')
    ? CONTACT_API_KEY
    : (getenv('CONTACT_API_KEY') ?: '');

if ($apiKey === '') {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Falta configurar CONTACT_API_KEY en el servidor de la landing.',
    ]);
    exit;
}

if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'La extension cURL de PHP no esta disponible en el servidor.',
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');

if ($rawBody === false || trim($rawBody) === '') {
    http_response_code(422);
    echo json_encode([
        'status' => 'invalid',
        'message' => 'El formulario esta vacio.',
    ]);
    exit;
}

$ch = curl_init($apiEndpoint);

if ($ch === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'No se pudo inicializar cURL.',
    ]);
    exit;
}

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => $rawBody,
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $response === '') {
    http_response_code(502);
    echo json_encode([
        'status' => 'error',
        'message' => 'No se pudo conectar con la API.',
        'detail' => $curlError,
    ]);
    exit;
}

http_response_code($httpCode ?: 502);
echo $response;
