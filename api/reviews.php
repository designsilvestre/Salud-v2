<?php
/**
 * Salud Odontologia · avaliações do Google (Places API New) com cache diário.
 * Fase 1: até 5 avaliações escolhidas pelo Google + nota e total atualizados.
 * Fase 2 (Business Profile API): trocar só a função fetch_reviews(); o formato de saída continua o mesmo.
 * Saída: {"rating":5,"total":256,"reviews":[{"name","photo","text","rating","when","uri"}],"source":"api|cache|empty"}
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$cfgFile = __DIR__ . '/config.php';
if (!is_file($cfgFile)) { echo json_encode(['reviews' => [], 'source' => 'empty']); exit; }
$cfg   = require $cfgFile;
$cache = __DIR__ . '/../cache/reviews.json';
$ttl   = (int)($cfg['ttl'] ?? 86400);

if (is_file($cache) && (time() - filemtime($cache)) < $ttl) { readfile($cache); exit; }

function fetch_reviews(array $cfg): ?array {
  $url = 'https://places.googleapis.com/v1/places/' . rawurlencode($cfg['place_id']) . '?languageCode=pt-BR';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_HTTPHEADER     => [
      'X-Goog-Api-Key: ' . $cfg['api_key'],
      'X-Goog-FieldMask: rating,userRatingCount,reviews',
    ],
  ]);
  $body = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code !== 200 || !$body) return null;
  $d = json_decode($body, true);
  if (!is_array($d)) return null;
  $out = ['rating' => $d['rating'] ?? null, 'total' => $d['userRatingCount'] ?? null, 'reviews' => []];
  foreach (($d['reviews'] ?? []) as $r) {
    $text = $r['text']['text'] ?? ($r['originalText']['text'] ?? '');
    if (trim($text) === '') continue;
    $out['reviews'][] = [
      'name'   => $r['authorAttribution']['displayName'] ?? 'Paciente',
      'photo'  => $r['authorAttribution']['photoUri'] ?? '',
      'uri'    => $r['authorAttribution']['uri'] ?? '',
      'text'   => $text,
      'rating' => $r['rating'] ?? null,
      'when'   => $r['relativePublishTimeDescription'] ?? '',
    ];
  }
  return $out;
}

$data = fetch_reviews($cfg);
if ($data !== null) {
  $data['source'] = 'api';
  @mkdir(dirname($cache), 0755, true);
  @file_put_contents($cache, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} elseif (is_file($cache)) {
  $old = json_decode(file_get_contents($cache), true) ?: [];
  $old['source'] = 'cache';
  echo json_encode($old, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
  echo json_encode(['reviews' => [], 'source' => 'empty']);
}
